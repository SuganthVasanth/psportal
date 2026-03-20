const Bus = require("../models/Bus");
const BusLocation = require("../models/BusLocation");
const Student = require("../models/Student");

exports.createBus = async (req, res) => {
  try {
    const { busNumber, route, incharge_id } = req.body;
    const bus = await Bus.create({ busNumber, route, incharge_id });
    res.status(201).json(bus);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getBuses = async (req, res) => {
  try {
    const buses = await Bus.find().populate("incharge_id", "name email");
    res.json(buses);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateBus = async (req, res) => {
  try {
    const { id } = req.params;
    const { busNumber, route, incharge_id } = req.body;
    const bus = await Bus.findByIdAndUpdate(id, { busNumber, route, incharge_id }, { new: true });
    res.json(bus);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteBus = async (req, res) => {
  try {
    const { id } = req.params;
    await Bus.findByIdAndDelete(id);
    await Student.updateMany({ bus_id: id }, { bus_id: null });
    await BusLocation.deleteOne({ bus_id: id });
    res.json({ message: "Bus deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getDayscholars = async (req, res) => {
  try {
    const students = await Student.find({ type: "dayscholar" }).populate("bus_id");
    res.json(students);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.assignStudentToBus = async (req, res) => {
  try {
    const { studentId, busId } = req.body;
    const student = await Student.findByIdAndUpdate(studentId, { bus_id: busId || null }, { new: true });
    res.json(student);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.bulkAssignStudentsToBus = async (req, res) => {
  try {
    const { studentIds, busId } = req.body;
    if (!Array.isArray(studentIds)) {
      return res.status(400).json({ message: "studentIds must be an array" });
    }
    await Student.updateMany({ _id: { $in: studentIds } }, { bus_id: busId || null });
    return res.json({ message: `Successfully assigned ${studentIds.length} students` });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

exports.getStudentBus = async (req, res) => {
  try {
    const { register_no } = req.params;
    const student = await Student.findOne({ register_no }).populate("bus_id");
    if (!student || !student.bus_id) {
      return res.status(404).json({ message: "Bus not found for this student" });
    }
    return res.json(student.bus_id);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

exports.getBusByIncharge = async (req, res) => {
  try {
    const { incharge_id } = req.params;
    const bus = await Bus.findOne({ incharge_id });
    if (!bus) {
      return res.status(404).json({ message: "No bus assigned to this incharge" });
    }
    return res.json(bus);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

exports.updateBusLocation = async (req, res) => {
  try {
    const { busId, latitude, longitude } = req.body;
    const location = await BusLocation.findOneAndUpdate(
      { bus_id: busId },
      { latitude, longitude, lastUpdated: Date.now() },
      { upsert: true, new: true }
    );

    const io = req.app.get("io");
    if (io && busId && latitude != null && longitude != null) {
      io.to(`bus-${busId}`).emit("location-updated", { latitude, longitude });
    }

    return res.json(location);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

exports.getBusLocation = async (req, res) => {
  try {
    const { busId } = req.params;
    const location = await BusLocation.findOne({ bus_id: busId });
    if (!location) {
      return res.status(404).json({ message: "Location not found" });
    }
    return res.json(location);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

