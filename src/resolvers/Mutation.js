import bcrypt from "bcryptjs";
import hashPassword from "../utils/hashPassword";
import generateToken from "../utils/generateToken";
import getUserId from "../utils/getUserId";

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
      user: {
        employeeId,
      },
      schedule: {
        schedule_No,
      },
    });

    if (employeeId && !isFreetimesExist) {
      const isSchedule_NoExist = await prisma.exists.Schedule({
        schedule_No,
      });
      if (!isSchedule_NoExist) {
        await prisma.mutation.createSchedule({
          data: {
            schedule_No,
          },
        });
      }

      let count = 0;
      for (let i = 0; i < 14; i++) {
        const day_No = schedule_No + "_" + i;
        await prisma.mutation.createFreetime(
          {
            data: {
              availability: "no",
              user: {
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

  //---------------------------  Schedule ----------------------------//

  async createSchedule(parent, args, { prisma, request }, info) {
    let count = 0;
    const defaultSchedule = await prisma.query.schedule(
      {
        where: {
          schedule_No: "0",
        },
      },
      `{
        schedule_No
        schedule_days {
          day_No
          schedule_staffs {
            staff {
              employeeId
            }
            position
            schedule_interval {
              interval_No
            }
          }
        }
      }`
    );
    console.log(defaultSchedule);
    //create schedule
    await prisma.mutation.createSchedule({
      data: {
        schedule_No: args.schedule_No,
      },
    });
    //create schedule_day
    for (let i = 0; i < 14; i++) {
      await prisma.mutation.createSchedule_Day({
        data: {
          day_No: `${schedule_No}_${i}`,
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
  async createSchedule_Default(parent, args, { prisma, request }, info) {
    let count = 0;
    //create schedule
    await prisma.mutation.createSchedule({
      data: {
        schedule_No: "0",
      },
    });
    //create schedule_day
    for (let i = 0; i < 14; i++) {
      await prisma.mutation.createSchedule_Day({
        data: {
          day_No: `0_${i}`,
          schedule: {
            connect: {
              schedule_No: "0",
            },
          },
        },
      });
      count++;
    }
    return { count };
  },
  async duplicateSchedule_Default(parent, args, { prisma, request }, info) {
    let count = 0;
    //fetch default schedule
    const defaultSchedule = await prisma.query.schedule(
      {
        where: {
          schedule_No: "0",
        },
      },
      `{
        schedule_days {
          day_No
          schedule_staffs {
            staff {
              employeeId
            }
            position
            schedule_interval {
              interval_No
            }
          }
        }
      }`
    );
    for (let i = 0; i < 7; i++) {
      const k = i + 7;
      const { schedule_staffs } = defaultSchedule.schedule_days[i];
      const { employeeId, position, interval_No } = schedule_staffs;
      for (let j = 0; j < schedule_staffs.length; j++) {
        let data = {
          position,
          schedule_interval: {
            connect: {
              interval_No,
            },
          },
          schedule_day: {
            connect: {
              day_No: `0_${k}`,
            },
          },
          Schedule: {
            connect: {
              schedule_No,
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
      }
    }
  },
  async deleteSchedule(parent, args, { prisma, request }, info) {
    const { schedule_No } = args;
    const isExist = await prisma.exists.Schedule({
      schedule_No,
    });
    if (isExist) {
      return prisma.mutation.deleteSchedule({
        where: {
          schedule_No,
        },
      });
    }
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

  async createSchedule_Interval(parent, args, { prisma, request }, info) {
    const { start, end } = args;
    const interval_No = start + "-" + end;
    return prisma.mutation.createSchedule_Interval(
      {
        data: {
          interval_No,
          start,
          end,
        },
      },
      info
    );
  },
  async createSchedule_Staff(parent, args, { prisma, request }, info) {
    const {
      day_No,
      employeeId,
      position,
      interval_No,
      schedule_No,
    } = args.data;
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
    let data = {
      schedule_day: {
        connect: {
          day_No,
        },
      },
      schedule: {
        connect: {
          schedule_No,
        },
      },
      position,
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
    return prisma.mutation.createSchedule_Staff({ data }, info);
  },
  async updateSchedule_Staff(parent, args, { prisma, request }, info) {
    const { id, employeeId, interval_No } = args.data;
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
    let data = {
      where: {
        id,
      },
      data: {
        schedule_interval: {
          connect: {
            interval_No,
          },
        },
      },
    };

    if (employeeId) {
      data.data = {
        ...data.data,
        staff: {
          connect: {
            employeeId,
          },
        },
      };
    }
    return prisma.mutation.updateSchedule_Staff(data, info);
  },
  deleteSchedule_Staff(parent, args, { prisma, request }, info) {
    return prisma.mutation.deleteSchedule_Staff(
      {
        where: {
          id: args.id,
        },
      },
      info
    );
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
};

export { Mutation as default };
