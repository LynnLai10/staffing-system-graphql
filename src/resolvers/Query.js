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

  schedule(parent, args, { prisma, request }, info) {
    return prisma.query.schedule(
      {
        where: {
          schedule_No: args.schedule_No
        },
      },
      info
    );
  },
};

export { Query as default };
