import express from "express";
import { dbStorage } from "../db.js";
import * as schema from "../../shared/schema.js";
import { eq, desc, and, sql } from "drizzle-orm";

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
      subtotal: parseFloat(subtotal),
      deliveryFee: parseFloat(deliveryFee),
      total: parseFloat(totalAmount),
      totalAmount: parseFloat(totalAmount),
      driverEarnings: 0,
      restaurantId,
      estimatedTime: '30-45 دقيقة'
    };

    const order = await dbStorage.createOrder(orderData);

    // إنشاء تتبع للطلب
    await dbStorage.createOrderTracking({
      orderId: order.id,
      status: 'pending',
      message: 'تم استلام الطلب وجاري المراجعة',
      createdBy: 'system',
      createdByType: 'system'
    });

    // إرسال إشعار للمطعم (محاكاة)
    await dbStorage.createNotification({
      type: 'new_order',
      title: 'طلب جديد',
      message: `طلب جديد رقم ${orderNumber} من ${customerName}`,
      recipientType: 'restaurant',
      recipientId: restaurantId,
      orderId: order.id
    });

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
    const orders = await dbStorage.getCustomerOrders(phone);
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
    const order = await dbStorage.getOrderById(orderId);
    
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    const tracking = await dbStorage.getOrderTracking(orderId);
    
    res.json({
      ...order,
      tracking
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
    await dbStorage.updateOrderStatus(orderId, status);

    // إضافة تتبع
    await dbStorage.createOrderTracking({
      orderId,
      status,
      message: message || `تم تحديث حالة الطلب إلى ${status}`,
      createdBy: updatedBy || 'system',
      createdByType: updatedByType || 'system'
    });

    // إرسال إشعار للعميل
    const order = await dbStorage.getOrderById(orderId);
    if (order) {
      await dbStorage.createNotification({
        type: 'order_status',
        title: 'تحديث حالة الطلب',
        message: message || `تم تحديث حالة طلبك رقم ${order.orderNumber}`,
        recipientType: 'customer',
        recipientId: order.customerPhone,
        orderId
      });
    }

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

    await dbStorage.updateOrderStatus(orderId, 'cancelled');

    await dbStorage.createOrderTracking({
      orderId,
      status: 'cancelled',
      message: `تم إلغاء الطلب. السبب: ${reason || 'غير محدد'}`,
      createdBy: cancelledBy || 'system',
      createdByType: 'system'
    });

    res.json({ success: true, status: 'cancelled' });
  } catch (error) {
    console.error("Cancel order error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;