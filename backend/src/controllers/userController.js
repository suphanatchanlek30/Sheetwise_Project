const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ดึงข้อมูลโปรไฟล์ของผู้ใช้ที่ล็อกอินอยู่
exports.getUserProfile = async (req, res) => {
  try {
    const userId = req.user.userId; // รับ userId จาก JWT ที่ถอดรหัสผ่าน Middleware

    // ดึงข้อมูลผู้ใช้จากฐานข้อมูล
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, role: true, createdAt: true }, // เลือกเฉพาะฟิลด์ที่ต้องการ
    });

    // ตรวจสอบว่าพบผู้ใช้หรือไม่
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // ส่งข้อมูลผู้ใช้กลับไป
    res.status(200).json({ user });
  } catch (error) {
    console.error('Error in getUserProfile:', error);
    res.status(500).json({ message: 'Something went wrong', error: error.message });
  }
};

// อัปเดตข้อมูลโปรไฟล์ของผู้ใช้ที่ล็อกอินอยู่
exports.updateUserProfile = async (req, res) => {
    try {
      const userId = req.user.userId; // รับ userId จาก JWT
      const { name, email } = req.body; // ข้อมูลที่ต้องการอัปเดตจาก Request Body
  
      // ตรวจสอบว่า Request Body มีข้อมูลที่ต้องการอัปเดตหรือไม่
      if (!name && !email) {
        return res.status(400).json({ message: 'Please provide name or email to update' });
      }
  
      // อัปเดตข้อมูลผู้ใช้ในฐานข้อมูล
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          ...(name && { name }), // อัปเดตชื่อ ถ้าส่งมา
          ...(email && { email }), // อัปเดตอีเมล ถ้าส่งมา
        },
        select: { id: true, email: true, name: true, role: true, createdAt: true }, // เลือกฟิลด์ที่ต้องการส่งกลับ
      });
  
      // ส่งข้อมูลที่อัปเดตกลับไป
      res.status(200).json({ message: 'Profile updated successfully', user: updatedUser });
    } catch (error) {
      console.error('Error in updateUserProfile:', error);
  
      // กรณีมีข้อผิดพลาด เช่น อีเมลซ้ำ
      if (error.code === 'P2002') {
        return res.status(400).json({ message: 'Email is already taken' });
      }
  
      res.status(500).json({ message: 'Something went wrong', error: error.message });
    }
};
  