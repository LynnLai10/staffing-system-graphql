import moment from "moment";
import bcrypt from "bcryptjs";
import hashPassword from "../utils/hashPassword.js";
import generateToken from "../utils/generateToken.js";
import getUserId from "../utils/getUserId.js";

const Mutation = {
  async createUser(parent, args, { prisma, request }, info) {
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
      return prisma.mutation.createUser({
        data: {
          ...args.data,
          password,
          useDefaultFreetime: false,
        },
      });
    } else {
      throw new Error("Permission denied.");
    }
  },
  async login(parent, args, { prisma }, info) {
    const { employeeId, password } = args.data;
    const oldUser = await prisma.query.user({
      where: {
        employeeId,
      },
    });

    if (!oldUser) {
      throw new Error("Unable to Login!");
    }

    const isMatch = await bcrypt.compare(password, oldUser.password);

    if (!isMatch) {
      throw new Error("Unable to Login!");
    }

    const user = await prisma.mutation.updateUser({
      where: {
        employeeId,
      },
      data: {
        loginTime: moment().format().toString(),
        lastLogin: oldUser.loginTime,
      },
    });
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
            employeeId: args.employeeId ? args.employeeId : employeeId,
          },
          data,
        },
        info
      );
    } else {
      throw new Error("Permission denied.");
    }
  },
  deleteUser(parent, args, { prisma, request }, info) {
    return prisma.mutation.deleteUser(
      {
        where: {
          employeeId: args.employeeId,
        },
      },
      info
    );
  },
  async changePassword(parent, args, { prisma, request }, info) {
    const employeeId = getUserId(request);
    const { data } = args;
    if (employeeId) {
      const user = await prisma.query.user({
        where: {
          employeeId: args.employeeId,
        },
      });
      const isMatch = await bcrypt.compare(data.currentPassword, user.password);
      if (!isMatch) {
        throw new Error("Wrong current password!");
      }
      data.password = await hashPassword(data.password);
      return prisma.mutation.updateUser(
        {
          where: {
            employeeId: args.employeeId,
          },
          data: {
            password: data.password,
          },
        },
        info
      );
    } else {
      throw new Error("Permission denied.");
    }
  },
  //----------------------  Freetime  -------------------------//
  async createFreetimes(parent, args, { prisma, request }, info) {
    const employeeId = getUserId(request);
    const { schedule_No } = args;
    const isFreetimesExist = await prisma.exists.Freetime({
      staff: {
        employeeId,
      },
      schedule: {
        schedule_No,
      },
    });

    if (employeeId && !isFreetimesExist) {
      const isSchedule_No_Exist = await prisma.exists.Schedule({
        schedule_No,
      });
      if (!isSchedule_No_Exist) {
        await prisma.mutation.createSchedule({
          data: {
            schedule_No,
          },
        });
        for (let i = 0; i < 14; i++) {
          await prisma.mutation.createSchedule_Day({
            data: {
              day_No: `${schedule_No}_${i}`,
              schedule: {
                connect: {
                  schedule_No,
                },
              },
            },
          });
        }
      }

      let count = 0;
      for (let i = 0; i < 14; i++) {
        const day_No = schedule_No + "_" + i;
        await prisma.mutation.createFreetime(
          {
            data: {
              availability: "full",
              staff: {
                connect: {
                  employeeId,
                },
              },
              schedule: {
                connect: {
                  schedule_No,
                },
              },
              schedule_day: {
                connect: {
                  day_No,
                },
              },
            },
          },
          "{id}"
        );
        count++;
      }
      return { count };
    } else {
      throw new Error("Permission denied.");
    }
  },
  async updateFreetime(parent, args, { prisma, request }, info) {
    const employeeId = getUserId(request);
    if (employeeId) {
      return prisma.mutation.updateFreetime(
        {
          where: {
            id: args.id,
          },
          data: args.data,
        },
        info
      );
    } else {
      throw new Error("Permission denied.");
    }
  },
  async deleteFreetimes(parent, args, { prisma, request }, info) {
    const employeeId = getUserId(request);
    if (employeeId) {
      return prisma.mutation.updateManyFreetimes(
        {
          where: {
            schedule: {
              schedule_No: args.schedule_No,
            },
          },
          data: {
            availability: "full",
          },
        },
        info
      );
    } else {
      throw new Error("Permission denied.");
    }
  },

  //---------------------------  Schedule ----------------------------//

  async createSchedule(parent, args, { prisma, request }, info) {
    let count = 0;
    const { schedule_No } = args;
    //create schedule
    await prisma.mutation.createSchedule({
      data: {
        schedule_No,
      },
    });
    //create schedule_day
    for (let i = 0; i < 14; i++) {
      await prisma.mutation.createSchedule_Day({
        data: {
          day_No: `${schedule_No}_${i}`,
          schedule: {
            connect: {
              schedule_No,
            },
          },
        },
      });
      count++;
    }
    return { count };
  },
  async createSchedule_Day_Batch(parent, args, { prisma, request }, info) {
    let count = 0;
    for (let i = 0; i < 14; i++) {
      await prisma.mutation.createSchedule_Day({
        data: {
          day_No: `${args.schedule_No}_${i}`,
          schedule: {
            connect: {
              schedule_No: args.schedule_No,
            },
          },
        },
      });
      count++;
    }
    return { count };
  },
  async updateSchedule_Staffs(parent, args, { prisma, request }, info) {
    const { oldStaffs, newStaffs } = args;
    //delete Staffs
    if (oldStaffs.length !== 0) {
      const oldStaffsId = oldStaffs.map((item) => item.id);
      let deletedStaffsId = [];
      if (newStaffs) {
        const newStaffsId = newStaffs.map((item) => item.id);
        deletedStaffsId = oldStaffsId.filter((id) => !newStaffsId.includes(id));
      } else {
        deletedStaffsId = oldStaffsId;
      }
      for (let i = 0; i < deletedStaffsId.length; i++) {
        await prisma.mutation.deleteSchedule_Staff({
          where: {
            id: deletedStaffsId[i],
          },
        });
      }
    }
    //dealing with newStaffs
    for (let i = 0; i < newStaffs.length; i++) {
      let { id, day_No, position, employeeId, interval_No } = newStaffs[i];
      //create new schedule_interval
      const isIntervalExist = await prisma.exists.Schedule_Interval({
        interval_No,
      });
      if (!isIntervalExist) {
        await prisma.mutation.createSchedule_Interval({
          data: {
            interval_No,
            start: interval_No.split("-")[0],
            end: interval_No.split("-")[1],
          },
        });
      }
      //create new Staff
      if (!id) {
        let data = {
          position,
          schedule_day: {
            connect: {
              day_No,
            },
          },
          schedule: {
            connect: {
              schedule_No: `${day_No.split("_")[0]}`,
            },
          },
          schedule_interval: {
            connect: {
              interval_No,
            },
          },
        };
        if (employeeId) {
          data = {
            ...data,
            staff: {
              connect: {
                employeeId,
              },
            },
          };
        }
        await prisma.mutation.createSchedule_Staff({
          data,
        });
      } else {
        const oldStaff = oldStaffs.find((item) => item.id === id);
        const isIntervalChange = oldStaff.interval_No !== interval_No;
        const isEmployeeIdChange = oldStaff.employeeId !== employeeId;
        let data = {};
        // only interval change
        if (isIntervalChange) {
          data = {
            schedule_interval: {
              connect: {
                interval_No,
              },
            },
          };
        }
        if (isEmployeeIdChange) {
          //employeeId: "xxxx" to ""
          if (oldStaff.employeeId) {
            data = {
              ...data,
              staff: {
                disconnect: true,
              },
            };
          } else {
            data = {
              ...data,
              staff: {
                connect: {
                  employeeId,
                },
              },
            };
          }
        }
        await prisma.mutation.updateSchedule_Staff({
          where: {
            id,
          },
          data,
        });
      }
    }
    return { count: 0 };
  },
  deleteSchedule_Staffs(parent, args, { prisma, request }, info) {
    return prisma.mutation.deleteManySchedule_Staffs(
      {
        where: {
          schedule: {
            schedule_No: args.schedule_No,
          },
        },
      },
      info
    );
  },

  //---------------------------  Item ----------------------------//

  async createItem(parent, args, { prisma, request }, info) {
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
      const isExist = await prisma.exists.Item({
        description_en: args.data.description_en,
      });
      if (isExist) {
        throw new Error("description taken!");
      }
      return prisma.mutation.createItem({
        data: args.data,
      });
    } else {
      throw new Error("Permission denied.");
    }
  },
  async updateItem(parent, args, { prisma, request }, info) {
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
      return prisma.mutation.updateItem(
        {
          where: {
            id: args.id,
          },
          data: args.data,
        },
        info
      );
    } else {
      throw new Error("Permission denied.");
    }
  },
  async deleteItem(parent, args, { prisma, request }, info) {
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
      return prisma.mutation.deleteItem(
        {
          where: {
            id: args.id,
          },
        },
        info
      );
    } else {
      throw new Error("Permission denied.");
    }
  },
};

export { Mutation as default };
