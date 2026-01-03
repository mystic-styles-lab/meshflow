import logging
import asyncio
import os
import atexit
import threading

from apscheduler.schedulers.background import BackgroundScheduler
from fastapi import FastAPI, Request, status
from fastapi.encoders import jsonable_encoder
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.routing import APIRoute

from config import ALLOWED_ORIGINS, DOCS, XRAY_SUBSCRIPTION_PATH

__version__ = "0.8.4"

app = FastAPI(
    title="MarzbanAPI",
    description="Unified GUI Censorship Resistant Solution Powered by Xray",
    version=__version__,
    docs_url="/docs" if DOCS else None,
    redoc_url="/redoc" if DOCS else None,
)

scheduler = BackgroundScheduler(
    {"apscheduler.job_defaults.max_instances": 20}, timezone="UTC"
)
logger = logging.getLogger("uvicorn.error")

# Proxy Balancer Service
balancer_server = None
balancer_thread = None

def run_balancer_async():
    """Run balancer in async event loop"""
    from app.services.balancer import SocksBalancer, ProxyManager
    from app.services.balancer.database import BalancerDatabase
    import traceback
    
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    
    try:
        # Initialize database and manager
        logger.info("Initializing balancer database...")
        db = BalancerDatabase()
        logger.info("Initializing proxy manager...")
        manager = ProxyManager(db)
        
        # Create and start balancer
        global balancer_server
        logger.info("Creating SOCKS balancer...")
        balancer_server = SocksBalancer(manager, tcp_port=7777, udp_port=7778)
        
        logger.info("Starting Python Proxy Balancer...")
        loop.run_until_complete(balancer_server.start())
        
        # Keep running
        logger.info("Balancer started successfully, entering main loop...")
        loop.run_forever()
    except Exception as e:
        logger.error(f"Balancer error: {e}")
        logger.error(f"Traceback: {traceback.format_exc()}")
    finally:
        loop.close()

def start_balancer():
    """Start the Python proxy balancer service"""
    global balancer_thread
    try:
        logger.info("Initializing Python Proxy Balancer...")
        
        # Start balancer in separate thread
        balancer_thread = threading.Thread(target=run_balancer_async, daemon=True)
        balancer_thread.start()
        
        logger.info("Python Proxy Balancer thread started")
    except Exception as e:
        logger.error(f"Failed to start Proxy Balancer: {e}")

def stop_balancer():
    """Stop the proxy balancer service"""
    global balancer_server, balancer_thread
    try:
        logger.info("Stopping Python Proxy Balancer...")
        
        if balancer_server:
            # Stop the balancer server synchronously
            balancer_server.stop_sync()
        
        if balancer_thread and balancer_thread.is_alive():
            balancer_thread.join(timeout=5)
        
        logger.info("Python Proxy Balancer stopped")
    except Exception as e:
        logger.error(f"Failed to stop Proxy Balancer: {e}")

# Register cleanup handler
atexit.register(stop_balancer)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
from app import dashboard, jobs, routers, telegram  # noqa
from app.routers import api_router  # noqa

app.include_router(api_router)


def use_route_names_as_operation_ids(app: FastAPI) -> None:
    for route in app.routes:
        if isinstance(route, APIRoute):
            route.operation_id = route.name


use_route_names_as_operation_ids(app)


@app.on_event("startup")
def on_startup():
    paths = [f"{r.path}/" for r in app.routes]
    paths.append("/api/")
    if f"/{XRAY_SUBSCRIPTION_PATH}/" in paths:
        raise ValueError(
            f"you can't use /{XRAY_SUBSCRIPTION_PATH}/ as subscription path it reserved for {app.title}"
        )
    scheduler.start()
    start_balancer()  # Start proxy balancer


@app.on_event("shutdown")
def on_shutdown():
    scheduler.shutdown()
    stop_balancer()  # Stop proxy balancer


@app.exception_handler(RequestValidationError)
def validation_exception_handler(request: Request, exc: RequestValidationError):
    details = {}
    for error in exc.errors():
        details[error["loc"][-1]] = error.get("msg")
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content=jsonable_encoder({"detail": details}),
    )
