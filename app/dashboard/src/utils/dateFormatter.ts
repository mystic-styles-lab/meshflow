import dayjs from "dayjs";

export const relativeExpiryDate = (expiryDate: number | null | undefined) => {
  let dateInfo = { status: "", time: "" };
  if (expiryDate) {
    const duration = dayjs.duration(
      dayjs(expiryDate * 1000)
        .utc()
        .diff(dayjs())
    );
    
    // Общее количество дней (округленное)
    const totalDays = Math.abs(Math.ceil(duration.asDays()));
    
    if (
      dayjs(expiryDate * 1000)
        .utc()
        .isAfter(dayjs().utc())
    ) {
      dateInfo.status = "expires";
      dateInfo.time = String(totalDays);
    } else {
      dateInfo.status = "expired";
      dateInfo.time = String(totalDays);
    }
  }
  return dateInfo;
};
