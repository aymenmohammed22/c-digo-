import express from "express";
import { storage } from "../storage.js";
import * as schema from "../../shared/schema.js";

const router = express.Router();

// إنشاء طلب جديد
router.post("/", async (req, res) => {
  try {
    const {
      customerName,
      customerPhone,
      customerEmail,
      deliveryAddress,
      notes,
      paymentMethod,
      items,
      subtotal,
      deliveryFee,
      totalAmount,
      restaurantId
    } = req.body;

    // التحقق من البيانات المطلوبة
    if (!customerName || !customerPhone || !deliveryAddress || !items || !restaurantId) {
      return res.status(400).json({ 
        message: "Missing required fields: customerName, customerPhone, deliveryAddress, items, restaurantId",
        received: { customerName, customerPhone, deliveryAddress, items: !!items, restaurantId }
      });
    }

    // إنشاء رقم طلب فريد
    const orderNumber = `ORD-${Date.now()}`;

    // إنشاء الطلب
    const orderData = {
      orderNumber,
      customerName,
      customerPhone,
      customerEmail: customerEmail || null,
      deliveryAddress,
      notes: notes || null,
      paymentMethod: paymentMethod || 'cash',
      status: 'pending',
      items: typeof items === 'string' ? items : JSON.stringify(items),
      subtotal: String(subtotal || 0),
      deliveryFee: String(deliveryFee || 0),
      total: String(totalAmount || 0),
      totalAmount: String(totalAmount || 0),
      driverEarnings: "0",
      restaurantId,
      estimatedTime: '30-45 دقيقة'
    };

    const order = await storage.createOrder(orderData);

    // تم إنشاء الطلب بنجاح

    res.status(201).json({
      success: true,
      order: {
        id: order.id,
        orderNumber,
        status: 'pending',
        estimatedTime: '30-45 دقيقة',
        total: totalAmount
      }
    });

  } catch (error) {
    console.error("Create order error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// الحصول على طلبات العميل
router.get("/customer/:phone", async (req, res) => {
  try {
    const { phone } = req.params;
    const orders = await storage.getOrders();
    res.json(orders);
  } catch (error) {
    console.error("Get customer orders error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// الحصول على تفاصيل طلب
router.get("/:orderId", async (req, res) => {
  try {
    const { orderId } = req.params;
    const orders = await storage.getOrders();
    const order = orders.find(o => o.id === orderId);
    
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }
    
    res.json({
      ...order
    });
  } catch (error) {
    console.error("Get order error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// تحديث حالة الطلب
router.patch("/:orderId/status", async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, message, updatedBy, updatedByType } = req.body;

    if (!status) {
      return res.status(400).json({ error: "Status is required" });
    }

    // تحديث حالة الطلب
    await storage.updateOrder(orderId, { status });

    // الحصول على الطلب المحدث
    const orders = await storage.getOrders();
    const order = orders.find(o => o.id === orderId);

    res.json({ success: true, status });
  } catch (error) {
    console.error("Update order status error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// إلغاء الطلب
router.patch("/:orderId/cancel", async (req, res) => {
  try {
    const { orderId } = req.params;
    const { reason, cancelledBy } = req.body;

    await storage.updateOrder(orderId, { status: 'cancelled' });

    res.json({ success: true, status: 'cancelled' });
  } catch (error) {
    console.error("Cancel order error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;