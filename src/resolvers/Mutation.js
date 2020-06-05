import bcrypt from "bcryptjs";
import hashPassword from "../utils/hashPassword";
import generateToken from "../utils/generateToken";
import getUserId from "../utils/getUserId";
import defaultFreetime from "../utils/defaultFreetime";

const Mutation = {
  async createUser(parent, args, { prisma, request }, info) {
    if (args.auth !== "Eg80949597") {
      throw new Error("Authentication required.");
    }
    const employeeId = getUserId(request);
    const user = await prisma.query.user(
      {
        where: {
          employeeId,
        },
      },
      "{ accountType }"
    );
    if (user.accountType === "Admin") {
      const employeeIdTaken = await prisma.exists.User({
        employeeId: args.data.employeeId,
      });
      const password = await hashPassword(args.data.password);
      if (employeeIdTaken) {
        throw new Error("EmployeeId taken!");
      }
      const user = await prisma.mutation.createUser({
        data: {
          ...args.data,
          password
        },
      });
      return {
        user,
        token: generateToken(user.employeeId),
      };
    } else {
      throw new Error("Permission denied.");
    }
  },
  async login(parent, args, { prisma }, info) {
    const user = await prisma.query.user({
      where: {
        employeeId: args.data.employeeId,
      },
    });

    if (!user) {
      throw new Error("Unable to Login!");
    }

    const isMatch = await bcrypt.compare(args.data.password, user.password);

    if (!isMatch) {
      throw new Error("Unable to Login!");
    }

    return {
      user,
      token: generateToken(user.employeeId),
    };
  },
  async updateUser(parent, args, { prisma, request }, info) {
    const employeeId = getUserId(request);
    if (employeeId) {
      const { data } = args;
      if (typeof data.password === "string") {
        data.password = await hashPassword(data.password);
      }
      return prisma.mutation.updateUser(
        {
          where: {
            employeeId: args.employeeId,
          },
          data,
        },
        info
      );
    }
  },
  async deleteUser(parent, args, { prisma, request }, info) {
    return prisma.mutation.deleteUser(
      {
        where: {
          employeeId: args.employeeId,
        },
      },
      info
    );
  },
  //----------------------  Freetime  -------------------------//
  createFreetime(parent, args, { prisma }, info) {
    console.log(args);
    return prisma.mutation.createFreetime(
      {
        data: {
          freetime_next: defaultFreetime,
          freetime_default: defaultFreetime,
          useDefault: false,
          user: {
            connect: {
              employeeId: args.employeeId,
            },
          },
        },
      },
      info
    );
  },
  async updateFreetime(parent, args, { prisma, request }, info) {
    const employeeId = getUserId(request);
    const myFreetime = await prisma.query.freetimes(
      {
        where: {
          user: {
            employeeId,
          },
        },
      },
      '{id}'
    );
    return prisma.mutation.updateFreetime(
      {
        where: {
          id: myFreetime[0].id,
        },
        data: args.data,
      },
      info
    );
  },
  async resetFreetime(parent, args, { prisma, request }, info) {
    const employeeId = getUserId(request);
    const myFreetime = await prisma.query.freetimes(
      {
        where: {
          user: {
            employeeId,
          },
        },
      },
      '{ id }'
    );
    let data = {};
    args.resetItem === "freetime_next"
      ? data.freetime_next = defaultFreetime 
      : data = { freetime_default: defaultFreetime, useDefault: false }
    return prisma.mutation.updateFreetime(
      {
        where: {
          id: myFreetime[0].id,
        },
        data,
      },
      info
    );
  },
  //---------------------------  Schedule ----------------------------//
  
  async createSchedule(parent, args, {prisma, request}, info) {
    return prisma.mutation.createSchedule({
      data: {
        schedule_No: args.schedule_No
      }
    }, info)
  },
  async createSchedule_Day(parent, args, {prisma, request}, info) {
    for (let i=0; i<14; i++) {
       prisma.mutation.createSchedule_Day({
        data: {
          day_No: `${args.schedule_No}-${i.toString()}`,
          schedule: {
            connect: {
              schedule_No: args.schedule_No
            }
          }
        }
      })
    }
  },
  async createSchedule_Interval(parent, args, {prisma, request}, info) {
    const { start, end } = args 
    const interval_No = start.toString() + end.toString()
    return prisma.mutation.createSchedule_Interval({
      data: {
        interval_No,
        start,
        end
      }
    }, info)
  },
  async createSchedule_Staff(parent, args, {prisma, request}, info) {
    const { day_No, employeeId, position, interval_No, schedule_No} = args.data
    let data = {
      schedule_day: {
        connect: {
          day_No
        }
      },
      schedule: {
        connect: {
          schedule_No
        }
      },
      position,
      schedule_interval: {
        connect: {
          interval_No
        }
      }
    }
    if (employeeId) {
      data = {
        ...data,
        staff: {
          connect: {
            employeeId
          }
        }
      }
    }
    return prisma.mutation.createSchedule_Staff({
      data
    }, info)
  }

};

export { Mutation as default };
