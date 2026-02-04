// import mongoose from "mongoose";

// export interface IAdminUser {
//   name: string;
//   email: string;
//   roleId: string;
//   region: "india" | "uk";
//   password: string;
//   isActive: boolean;
//     userId: string;
// }

// const adminUserSchema = new mongoose.Schema<IAdminUser>(
    
//   {
//     userId: { type: String, required: true, unique: true },
//     name: {
//       type: String,
//       required: true,
//       trim: true,
//     },

//     email: {
//       type: String,
//       required: true,
//       unique: true,
//       lowercase: true,
//     },

//     roleId: {
//       type: String,
//       required: true, // references Role.roleId
//     },

//     region: {
//       type: String,
//       enum: ["in", "uk"],
//       required: true,
//     },

//     password: {
//       type: String,
//       required: true,
//     },

//     isActive: {
//       type: Boolean,
//       default: true,
//     },
//   },
//   { timestamps: true }
// );

// export const AdminUser = mongoose.model<IAdminUser>(
//   "AdminUser",
//   adminUserSchema
// );



import mongoose from "mongoose";

export interface IAdminUser {
  userId: string;

  // Profile
  name: string;
  email: string;
  roleId: string;
  region: "in" | "uk";

  // Auth
  password: string;
  oldPassword?: string;
  passwordStatus: -1 | 0 | 1;
  passwordExpireFlag: 0 | 1;

  // OTP
  otp?: string | null;
  otpExpiresAt?: Date | null;

  // Status
  isActive: boolean;

  // Audit
  lastLoginAt?: Date;
  loginAttempts: number;
  lockUntil?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const adminUserSchema = new mongoose.Schema<IAdminUser>(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    // -------- Profile --------
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      index: true,
    },

    roleId: {
      type: String,
      required: true,
    },

    region: {
      type: String,
      enum: ["in", "uk"],
      required: true,
    },

    // -------- Auth --------
    password: {
      type: String,
      required: true,
      select: false, // 🔒 never return password
    },

    oldPassword: {
      type: String,
      select: false,
    },

    passwordStatus: {
      type: Number,
      enum: [-1, 0, 1],
      default: -1,
    },

    passwordExpireFlag: {
      type: Number,
      enum: [0, 1],
      default: 0,
    },

    // -------- OTP --------
    otp: {
      type: String,
      default: null,
      select: false,
    },

    otpExpiresAt: {
      type: Date,
      default: null,
      select: false,
    },

    // -------- Status --------
    isActive: {
      type: Boolean,
      default: true,
    },

    // -------- Audit --------
    lastLoginAt: {
      type: Date,
    },
    loginAttempts: {
  type: Number,
  default: 0,
},

lockUntil: {
  type: Date,
  default: null,
},

  },
  { timestamps: true }
);

export const AdminUser = mongoose.model<IAdminUser>(
  "AdminUser",
  adminUserSchema
);
