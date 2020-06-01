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
  createSchedule(parent, args, { prisma }, info) {
    console.log(args);
    return prisma.mutation.createSchedule(
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
  async updateSchedule(parent, args, { prisma, request }, info) {
    const employeeId = getUserId(request);
    const mySchedule = await prisma.query.schedules(
      {
        where: {
          user: {
            employeeId,
          },
        },
      },
      '{id}'
    );
    return prisma.mutation.updateSchedule(
      {
        where: {
          id: mySchedule[0].id,
        },
        data: args.data,
      },
      info
    );
  },
  async resetSchedule(parent, args, { prisma, request }, info) {
    const employeeId = getUserId(request);
    const mySchedule = await prisma.query.schedules(
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
    return prisma.mutation.updateSchedule(
      {
        where: {
          id: mySchedule[0].id,
        },
        data,
      },
      info
    );
  },
};

export { Mutation as default };
