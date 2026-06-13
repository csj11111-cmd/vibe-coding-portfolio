const express = require("express");
const Todo = require("../models/Todo");

const router = express.Router();

router.get("/", async (_req, res) => {
  try {
    const todos = await Todo.find().sort({ createdAt: -1 });
    res.json(todos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const todo = await Todo.findById(req.params.id);

    if (!todo) {
      res.status(404).json({ error: "할 일을 찾을 수 없습니다." });
      return;
    }

    res.json(todo);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post("/", async (req, res) => {
  const { title, date, time, category, priority, description } = req.body;

  if (!title || !date || !category || !priority) {
    res.status(400).json({
      error: "title, date, category, priority는 필수입니다.",
    });
    return;
  }

  try {
    const todo = await Todo.create({
      title,
      date,
      time: time || "",
      category,
      priority,
      description: description || "",
    });

    res.status(201).json(todo);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.put("/:id", async (req, res) => {
  const { title, date, time, category, priority, description } = req.body;

  if (!title || !date || !category || !priority) {
    res.status(400).json({
      error: "title, date, category, priority는 필수입니다.",
    });
    return;
  }

  try {
    const todo = await Todo.findByIdAndUpdate(
      req.params.id,
      {
        title,
        date,
        time: time || "",
        category,
        priority,
        description: description || "",
      },
      { new: true, runValidators: true }
    );

    if (!todo) {
      res.status(404).json({ error: "할 일을 찾을 수 없습니다." });
      return;
    }

    res.json(todo);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
