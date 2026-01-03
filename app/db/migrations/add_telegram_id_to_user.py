"""Add telegram_id to User table

Revision ID: add_telegram_id
Create Date: 2026-01-01
"""

from alembic import op
import sqlalchemy as sa


def upgrade():
    """Add telegram_id column to users table"""
    op.add_column('users', sa.Column('telegram_id', sa.BigInteger(), nullable=True))
    op.create_index('ix_users_telegram_id', 'users', ['telegram_id'], unique=True)


def downgrade():
    """Remove telegram_id column from users table"""
    op.drop_index('ix_users_telegram_id', table_name='users')
    op.drop_column('users', 'telegram_id')
