import getUserId from "../utils/getUserId.js";
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
  async freetimes(parent, args, { prisma }, info) {
    const staffList_useDefault = await prisma.query.users(
      {
        where: {
          useDefaultFreetime: true,
        },
      },
      "{employeeId}"
    );
    const defaultFreetimes = await prisma.query.freetimes(
      {
        where: {
          availability_not: "no",
          schedule: {
            schedule_No: "0",
          },
          staff: {
            OR: staffList_useDefault,
          },
        },
      },
      `{schedule_day {
          day_No
        }
        staff {
          employeeId
          name
          sex
        }
        availability}`
    );
    const nextFreetimes = await prisma.query.freetimes(
      {
        where: {
          availability_not: "no",
          schedule: {
            schedule_No: args.schedule_No,
          },
          staff: {
            NOT: staffList_useDefault,
          },
        },
      },
      `{schedule_day {
          day_No
        }
        staff {
          employeeId
          name
          sex
        }
        availability}`
    );
    return defaultFreetimes.concat(nextFreetimes);
  },
  async myFreetimes(parent, args, { prisma, request }, info) {
    const employeeId = await getUserId(request);
    const res = await prisma.query.freetimes(
      {
        where: {
          staff: {
            employeeId,
          },
          schedule: {
            schedule_No: args.schedule_No,
          },
        },
      },
      info
    );
    return res;
    // .map((item, index) =>
    //   res.find(
    //     (item) => item.schedule_day.day_No.split("_")[1] === index.toString()
    //   )
    // );
  },
  //----------------------  Schedule  -------------------------//

  schedule(parent, args, { prisma, request }, info) {
    return prisma.query.schedule(
      {
        where: {
          schedule_No: args.schedule_No,
        },
      },
      info
    );
  },
  async mySchedule(parent, args, { prisma, request }, info) {
    const employeeId = await getUserId(request);
    return prisma.query.schedule_Staffs(
      {
        where: {
          schedule: {
            schedule_No: args.schedule_No,
          },
          staff: {
            employeeId,
          },
        },
      },
      info
    );
  },

  //----------------------  Item  -------------------------//

  async items(parent, args, { prisma, request }, info) {
    const opArgs = {
      first: args.first,
      skip: args.skip,
      orderBy: args.orderBy,
      where: {
        category: args.category,
      },
    };
    //get the sum of all data in the category
    const itemCount = await prisma.query.itemsConnection(
      {
        where: {
          category: args.category,
        },
      },
      "{ aggregate{count}}"
    );
    //get data in the category
    const items = await prisma.query.items(opArgs);
    return {
      items,
      count: itemCount.aggregate.count,
    };
  },
};

export { Query as default };
