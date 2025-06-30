const createUser = async (req, res) => {
  try {
    const newUser = new User(req.body);
    await newUser.save();
    res.status(201).json(newUser);
  } catch (error) {
    res.status(400).json({ message: "Kullanıcı oluşturulamadı", error });
  }
};

const deleteUser = async (req, res) => {
  try {
    const deletedUser = await User.findByIdAndDelete(req.params.id);
    if (!deletedUser) return res.status(404).json({ message: "Kullanıcı bulunamadı" });
    res.status(200).json({ message: "Kullanıcı silindi" });
  } catch (error) {
    res.status(500).json({ message: "Silme sırasında hata oluştu", error });
  }
};
