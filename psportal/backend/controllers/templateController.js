const QuestionTemplate = require("../models/QuestionTemplate");

exports.create = async (req, res) => {
  try {
    const { key, name, description, layout, config } = req.body;
    if (!name || !Array.isArray(layout)) {
      return res.status(400).json({ message: "name and layout array are required" });
    }
    const template = await QuestionTemplate.create({
      key,
      name: name.trim(),
      description: description ? description.trim() : "",
      config: config || {},
      layout: layout.map((item) => ({
        id: item.id,
        type: item.type,
        x: Number(item.x) || 0,
        y: Number(item.y) || 0,
        width: Number(item.width) || 200,
        height: Number(item.height) || 80,
        properties: item.properties || {},
      })),
    });
    res.status(201).json(template);
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to create template" });
  }
};

exports.getAll = async (req, res) => {
  try {
    const { search } = req.query;
    const filter = {};
    if (search && search.trim()) {
      filter.$or = [
        { name: { $regex: search.trim(), $options: "i" } },
        { description: { $regex: search.trim(), $options: "i" } },
      ];
    }
    const templates = await QuestionTemplate.find(filter).sort({ updatedAt: -1 }).lean();
    res.json(templates);
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to fetch templates" });
  }
};

exports.getById = async (req, res) => {
  try {
    const template = await QuestionTemplate.findById(req.params.id).lean();
    if (!template) return res.status(404).json({ message: "Template not found" });
    res.json(template);
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to fetch template" });
  }
};

exports.update = async (req, res) => {
  try {
    const { name, description, layout, config } = req.body;
    const template = await QuestionTemplate.findById(req.params.id);
    if (!template) return res.status(404).json({ message: "Template not found" });
    if (name !== undefined) template.name = name.trim();
    if (description !== undefined) template.description = description.trim();
    if (config) {
      const existing =
        (template.config && typeof template.config.toObject === "function"
          ? template.config.toObject()
          : template.config) || {};
      template.config = { ...existing, ...config };
    }
    if (Array.isArray(layout)) {
      template.layout = layout.map((item) => ({
        id: item.id,
        type: item.type,
        x: Number(item.x) || 0,
        y: Number(item.y) || 0,
        width: Number(item.width) || 200,
        height: Number(item.height) || 80,
        properties: item.properties || {},
      }));
    }
    await template.save();
    res.json(template);
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to update template" });
  }
};

exports.remove = async (req, res) => {
  try {
    const template = await QuestionTemplate.findById(req.params.id);
    if (!template) return res.status(404).json({ message: "Template not found" });
    if (template.isDefault) {
      return res.status(400).json({ message: "Default templates cannot be deleted" });
    }
    await template.deleteOne();
    res.json({ message: "Template deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to delete template" });
  }
};
