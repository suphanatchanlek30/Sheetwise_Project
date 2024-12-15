const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ยืนยันการชำระเงิน
exports.confirmPayment = async (req, res) => {
    try {
      const { id } = req.params; // รับ ID คำสั่งซื้อจาก URL
      const userId = req.user.userId; // รับ userId จาก JWT
  
      // ตรวจสอบคำสั่งซื้อ
      const order = await prisma.order.findUnique({
        where: { id: parseInt(id) },
      });
  
      if (!order) {
        return res.status(404).json({ message: 'Order not found' });
      }
  
      // ตรวจสอบว่าคำสั่งซื้อเป็นของผู้ใช้หรือไม่
      if (order.userId !== userId) {
        return res.status(403).json({ message: 'Access denied' });
      }
  
      // อัปเดตสถานะคำสั่งซื้อเป็น paid
      const updatedOrder = await prisma.order.update({
        where: { id: parseInt(id) },
        data: { status: 'paid' },
      });
  
      res.status(200).json({
        message: 'Payment confirmed successfully',
        order: updatedOrder,
      });
    } catch (error) {
        res.status(500).json({ message: 'Something went wrong', error });
    }
};

// ฟังก์ชันสำหรับดาวน์โหลดชีท
exports.downloadSheet = async (req, res) => {
  try {
    const { id } = req.params; // รับ id ของคำสั่งซื้อจาก URL
    const userId = req.user.userId; // รับ userId จาก JWT ที่ถอดรหัสผ่าน Middleware

    // 1. ตรวจสอบว่าคำสั่งซื้อมีอยู่จริง และเชื่อมโยงกับผู้ใช้นี้หรือไม่
    const order = await prisma.order.findUnique({
      where: { id: parseInt(id) }, // ค้นหาด้วย id
      include: { sheet: true }, // ดึงข้อมูลชีทที่เชื่อมโยงกับคำสั่งซื้อ
    });

    // ตรวจสอบว่าพบคำสั่งซื้อหรือไม่
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // ตรวจสอบว่าคำสั่งซื้อนี้เป็นของผู้ใช้นี้หรือไม่
    if (order.userId !== userId) {
      return res.status(403).json({ message: "Access denied: This is not your order" });
    }

    // 2. ตรวจสอบว่าสถานะคำสั่งซื้อเป็น 'paid'
    if (order.status !== "paid") {
      return res.status(400).json({
        message: "Payment is not completed. You cannot download this sheet.",
      });
    }

    // 3. ส่งลิงก์สำหรับดาวน์โหลดชีทกลับไปยังผู้ใช้
    return res.status(200).json({
      message: "Sheet download link generated successfully",
      downloadUrl: order.sheet.fileUrl, // ส่งลิงก์ไฟล์ชีทที่เก็บไว้ในฐานข้อมูล
    });
  } catch (error) {
    // กรณีเกิดข้อผิดพลาด
    console.error("Error in downloadSheet:", error);
    return res.status(500).json({
      message: "Something went wrong",
      error: error.message,
    });
  }
};
