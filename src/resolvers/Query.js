import getUserId from "../utils/getUserId";
const Query = {
  async users(parent, args, { prisma, request }, info) {
    const employeeId = await getUserId(request);
    const user = await prisma.query.user(
      {
        where: {
          employeeId,
        },
      },
      "{ accountType }"
    );
    if (user.accountType === "Admin") {
      return prisma.query.users({ orderBy: args.orderBy }, info);
    } else {
      throw new Error("Permission denied.");
    }
  },
  async me(parent, args, { prisma, request }, info) {
    const employeeId = await getUserId(request);
    return prisma.query.user({
      where: {
        employeeId: employeeId,
      },
    });
  },
  //----------------------  Freetime  -------------------------//
  freetimes(parent, args, { prisma }, info) {
    return prisma.query.freetimes({ 
        where: {
            schedule_day: {
              day_No: args.day_No
            },
            availability: args.availability,
        }
     }, info);
  },
  async myFreetimes(parent, args, { prisma, request }, info) {
    const employeeId = await getUserId(request);
    const res = await prisma.query.freetimes(
      {
        where: {
          user: {
            employeeId,
          },
          schedule: {
            schedule_No: args.schedule_No,
          },
        },
      },
      info
    );
    return res
    // .map((item, index) =>
    //   res.find(
    //     (item) => item.schedule_day.day_No.split("_")[1] === index.toString()
    //   )
    // );
  },
  //----------------------  Schedule  -------------------------//
  schedules(parent, args, { prisma, request }, info) {
    return prisma.query.schedules(
      {
        where: {
          schedule_No: args.schedule_No,
          // freetimes_some: {
          //   availability: args.availability
          // }
        },
      },
      info
    );
  },
  async schedule_days(parent, args, { prisma, request }, info) {
    const res = await prisma.query.schedule_Days(
      {
        where: {
          schedule: {
            schedule_No: args.schedule_No,
          },
        },
      },
      info
    );
    return res.map((item, index) =>
      res.find(
        (item) => item.day_No.split("_")[1] === index.toString()
      )
    );
  },
  async schedule_staff(parent, args, { prisma, request }, info) {
    return prisma.query.schedule_Staff(
      {
        where: {
          id: args.id,
        },
      },
      info
    );
  },
  async schedule_staffs(parent, args, { prisma, request }, info) {
    const res = await prisma.query.schedule_Staffs({
        where: {
            schedule_day: {
                day_No: args.day_No
            }
        }
    },info)
    return res.sort((a,b) => {
        if (a.schedule_interval.start === b.schedule_interval.start) {
            return b.schedule_interval.end - a.schedule_interval.end
        }
        return a.schedule_interval.start - b.schedule_interval.start
    })
  },
  schedule_interval(parent, args, { prisma, request }, info) {
    const { start, end } = args;
    return prisma.query.schedule_intervals(
      {
        where: {
          start,
          end,
        },
      },
      info
    );
  },
};

export { Query as default };
