import express from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import mongoose from "mongoose";
import cors from "cors";

dotenv.config();
const app = express();
const port = process.env.PORT || 3001;
const secretKey = process.env.SECRET_KEY || "your-secret-key";
app.use(express.json());
app.use(
  cors({
    origin: "http://localhost:3000",
  })
);

// Middleware để xác thực token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];

  if (!authHeader) {
    return res.sendStatus(401); // Unauthorized
  }

  const token = authHeader.split(" ")[1];

  try {
    const user = jwt.verify(token, secretKey);
    req.user = user;
    next();
  } catch (err) {
    return res.sendStatus(403); // Forbidden
  }
};

// Kết nối tới cơ sở dữ liệu MongoDB
mongoose
  .connect(
    "mongodb+srv://thienlong:MtdtcmlpqdbH@cluster0.fhukxgc.mongodb.net/mydatabase"
  )
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((err) => {
    console.error("Failed to connect to MongoDB:", err);
  });

// Mô hình dữ liệu cho token
const TokenSchema = new mongoose.Schema({
  token: {
    type: String,
    required: true,
  },
});

// Model cho Token
const TokenModel = mongoose.model("Token", TokenSchema);

// Mô hình dữ liệu cho phim
const MovieSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  time: {
    type: Number,
    required: true,
  },
  year: {
    type: Number,
    required: true,
  },
  image: {
    type: String,
    required: true,
  },
  introduce: {
    type: String,
    required: true,
  },
});

// Model cho Phim
const MovieModel = mongoose.model("Movie", MovieSchema);

// Route Login
app.post("/login", (req, res) => {
  const { username, password } = req.body;

  if (username === "admin" && password === "admin123") {
    const token = jwt.sign({ username }, secretKey, {
      expiresIn: "1h",
    });

    res.json({ token });
  } else {
    res.sendStatus(401); // Unauthorized
  }
});

// Route Logout
app.get("/logout", authenticateToken, async (req, res) => {
  try {
    await TokenModel.deleteOne({ token: req.token });
    res.sendStatus(200); // OK
  } catch (err) {
    console.error(err);
    res.sendStatus(500); // Internal Server Error
  }
});

// Lấy danh sách tất cả phim
app.get("/movies", async (req, res) => {
  try {
    const movies = await MovieModel.find();
    res.json(movies);
  } catch (err) {
    console.error(err);
    res.sendStatus(500); // Internal Server Error
  }
});

// Tìm kiếm phim theo tên
app.get("/movies/search", async (req, res) => {
  const { query } = req.query;

  try {
    const movies = await MovieModel.find({
      name: { $regex: query, $options: "i" },
    });
    res.json(movies);
  } catch (err) {
    console.error(err);
    res.sendStatus(500); // Internal Server Error
  }
});

// Lấy thông tin một phim cụ thể
app.get("/movies/:id", async (req, res) => {
  try {
    const movie = await MovieModel.findOne({ _id: req.params.id });
    if (movie) {
      res.json(movie);
    } else {
      res.sendStatus(404); // Not Found
    }
  } catch (err) {
    console.error(err);
    res.sendStatus(500); // Internal Server Error
  }
});

// Tạo một phim mới
app.post("/movies", async (req, res) => {
  try {
    const movie = await MovieModel.create(req.body);
    res.json(movie);
  } catch (err) {
    console.error(err);
    res.sendStatus(500); // Internal Server Error
  }
});

// Cập nhật thông tin một phim
app.put("/movies/:id", async (req, res) => {
  try {
    const movie = await MovieModel.findOneAndUpdate(
      { _id: req.params.id },
      req.body,
      { new: true }
    );
    if (movie) {
      res.json(movie);
    } else {
      res.sendStatus(404); // Not Found
    }
  } catch (err) {
    console.error(err);
    res.sendStatus(500); // Internal Server Error
  }
});

// Xóa một phim
app.delete("/movies/:id", async (req, res) => {
  try {
    const movie = await MovieModel.findOneAndDelete({ _id: req.params.id });
    if (movie) {
      res.sendStatus(200); // OK
    } else {
      res.sendStatus(404); // Not Found
    }
  } catch (err) {
    console.error(err);
    res.sendStatus(500); // Internal Server Error
  }
});

// Lấy danh sách phim được sắp xếp theo năm (tăng/giảm dần)
app.get("/movies/sortedByYear/:order", async (req, res) => {
  const { order } = req.params;

  try {
    let movies;
    if (order === "asc") {
      // Sắp xếp tăng dần theo năm
      movies = await MovieModel.find().sort({ year: 1 });
    } else if (order === "desc") {
      // Sắp xếp giảm dần theo năm
      movies = await MovieModel.find().sort({ year: -1 });
    } else {
      return res.status(400).json({ message: "Invalid sorting order" });
    }
    res.json(movies);
  } catch (err) {
    console.error(err);
    res.sendStatus(500); // Internal Server Error
  }
});

// Khởi động server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
