const Message = require("../models/Message");
const User = require("../models/User");

// GET /api/messages?withUserId=xxx - conversation with that user (ordered by createdAt)
exports.getMessages = async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const withUserId = req.query.withUserId;
    if (!withUserId) {
      // Faculty inbox: return all messages where I'm participant, with other user info
      const messages = await Message.find({
        $or: [{ from_user_id: userId }, { to_user_id: userId }],
      })
        .populate("from_user_id", "name email")
        .populate("to_user_id", "name email")
        .sort({ createdAt: 1 })
        .lean();
      const list = messages.map((m) => ({
        id: m._id.toString(),
        from_user_id: m.from_user_id?._id?.toString(),
        from_name: m.from_user_id?.name || m.from_user_id?.email,
        to_user_id: m.to_user_id?._id?.toString(),
        to_name: m.to_user_id?.name || m.to_user_id?.email,
        type: m.type,
        content: m.content,
        file_url: m.file_url,
        file_name: m.file_name,
        suggested_changes: m.suggested_changes,
        created_at: m.createdAt,
        is_mine: m.from_user_id?._id?.toString() === userId,
      }));
      return res.json({ messages: list });
    }

    const messages = await Message.find({
      $or: [
        { from_user_id: userId, to_user_id: withUserId },
        { from_user_id: withUserId, to_user_id: userId },
      ],
    })
      .populate("from_user_id", "name email")
      .populate("to_user_id", "name email")
      .sort({ createdAt: 1 })
      .lean();

    const list = messages.map((m) => ({
      id: m._id.toString(),
      from_user_id: m.from_user_id?._id?.toString(),
      from_name: m.from_user_id?.name || m.from_user_id?.email,
      to_user_id: m.to_user_id?._id?.toString(),
      to_name: m.to_user_id?.name || m.to_user_id?.email,
      type: m.type,
      content: m.content,
      file_url: m.file_url,
      file_name: m.file_name,
      suggested_changes: m.suggested_changes,
      created_at: m.createdAt,
      is_mine: m.from_user_id?._id?.toString() === userId,
    }));

    res.json({ messages: list });
  } catch (err) {
    console.error("getMessages error:", err);
    res.status(500).json({ message: "Failed to load messages" });
  }
};

// POST /api/messages - send message (to_user_id, type: text|file, content?, file_url?, file_name?, suggested_changes?)
exports.sendMessage = async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const { to_user_id, type, content, file_url, file_name, suggested_changes } = req.body;
    if (!to_user_id) return res.status(400).json({ message: "to_user_id required" });
    if (!type || !["text", "file"].includes(type)) return res.status(400).json({ message: "type must be text or file" });

    const doc = await Message.create({
      from_user_id: userId,
      to_user_id,
      type: type || "text",
      content: content ?? "",
      file_url: file_url ?? "",
      file_name: file_name ?? "",
      suggested_changes: suggested_changes ?? "",
    });

    const populated = await Message.findById(doc._id)
      .populate("from_user_id", "name email")
      .populate("to_user_id", "name email")
      .lean();

    res.status(201).json({
      id: populated._id.toString(),
      from_name: populated.from_user_id?.name || populated.from_user_id?.email,
      to_name: populated.to_user_id?.name || populated.to_user_id?.email,
      type: populated.type,
      content: populated.content,
      file_url: populated.file_url,
      file_name: populated.file_name,
      suggested_changes: populated.suggested_changes,
      created_at: populated.createdAt,
      is_mine: true,
    });
  } catch (err) {
    console.error("sendMessage error:", err);
    res.status(500).json({ message: "Failed to send" });
  }
};
