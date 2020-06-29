const Schedule = {
  schedule_days(parent, args, { prisma }, info) {
    if (parent.schedule_days) {
      const { schedule_days } = parent;
      if (schedule_days && schedule_days[0].schedule_staffs) {
        schedule_days[0].schedule_staffs.sort((a, b) => {
          if (a.schedule_interval.start === b.schedule_interval.start) {
            return b.schedule_interval.end - a.schedule_interval.end;
          }
          return a.schedule_interval.start - b.schedule_interval.start;
        });
      }
      return (
        schedule_days &&
        schedule_days.map((item, index) =>
          schedule_days.find(
            (item) => item.day_No.split("_")[1] === index.toString()
          )
        )
      );
    }
  },
};

export { Schedule as default };
