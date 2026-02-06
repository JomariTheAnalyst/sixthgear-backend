# Admin Guide: Email Notifications

## Quick Reference for SixthGear Admins

This guide explains how to send email notifications to customers for order updates.

---

## Automatic Emails (No Action Required)

### Order Confirmation ✅

**When**: Automatically sent when customer places an order  
**What**: Order details, payment status, items, shipping address  
**Action**: None - happens automatically

---

## Manual Emails (Admin Action Required)

### 1. Order Shipped Notification

**When to Send**: After you've shipped the order and have tracking information

**How to Send**:

#### Option A: Using Medusa Admin API

```bash
POST http://localhost:9000/admin/orders/{order_id}/ship
Authorization: Bearer {your_admin_token}
Content-Type: application/json

{
  "tracking_number": "1234567890",
  "tracking_url": "https://track.lbc.com.ph/1234567890",
  "carrier": "LBC Express"
}
```

#### Option B: Using cURL (Command Line)

```bash
curl -X POST http://localhost:9000/admin/orders/order_01JKXXX/ship \
  -H "Authorization: Bearer your_admin_token" \
  -H "Content-Type: application/json" \
  -d '{
    "tracking_number": "ABC123456789",
    "tracking_url": "https://track.lbc.com.ph/ABC123456789",
    "carrier": "LBC Express"
  }'
```

**Email Includes**:

- Shipment confirmation
- Tracking number
- Tracking link (clickable button)
- Carrier name
- Items shipped
- Estimated delivery (3-5 business days)
- Contact information

---

### 2. Order Delivered Notification

**When to Send**: After the order has been delivered to the customer

**How to Send**:

#### Option A: Using Medusa Admin API

```bash
POST http://localhost:9000/admin/orders/{order_id}/deliver
Authorization: Bearer {your_admin_token}
Content-Type: application/json

{
  "delivered_date": "2026-02-06T10:30:00Z"
}
```

#### Option B: Using cURL (Command Line)

```bash
curl -X POST http://localhost:9000/admin/orders/order_01JKXXX/deliver \
  -H "Authorization: Bearer your_admin_token" \
  -H "Content-Type: application/json" \
  -d '{
    "delivered_date": "2026-02-06T10:30:00Z"
  }'
```

**Note**: If you don't specify `delivered_date`, it will use the current date/time.

**Email Includes**:

- Delivery confirmation
- Items delivered
- Total paid
- Feedback request (5-star rating)
- Return/exchange policy (7 days)
- Thank you message
- Contact information

---

## Common Carriers in Philippines

Use these carrier names for consistency:

- **LBC Express**: `"LBC Express"`
- **J&T Express**: `"J&T Express"`
- **Ninja Van**: `"Ninja Van"`
- **Flash Express**: `"Flash Express"`
- **JRS Express**: `"JRS Express"`
- **2GO Express**: `"2GO Express"`
- **Lalamove**: `"Lalamove"`
- **Grab Express**: `"Grab Express"`

---

## Tracking URL Examples

### LBC Express

```
https://www.lbcexpress.com/track/?tracking_no={tracking_number}
```

### J&T Express

```
https://www.jtexpress.ph/trajectoryQuery?trackingNo={tracking_number}
```

### Ninja Van

```
https://www.ninjavan.co/en-ph/tracking?id={tracking_number}
```

---

## Step-by-Step Workflow

### When Order is Placed

1. ✅ Customer receives order confirmation email automatically
2. ✅ Email shows payment status (Paid via Stripe or COD Pending)
3. ✅ For COD orders, email reminds customer to prepare exact amount

### When You Ship the Order

1. Get tracking number from courier
2. Get tracking URL (or construct it using examples above)
3. Send "Order Shipped" email via API
4. Customer receives email with tracking information

### When Order is Delivered

1. Confirm delivery with courier or customer
2. Send "Order Delivered" email via API
3. Customer receives email with feedback request

---

## Contact Information in All Emails

Every email includes:

```
Questions or concerns? Message us:

📱 0995 093 0157
💬 facebook.com/camille.sixthgear
```

This ensures customers always know how to reach you!

---

## Testing

### Test Order Shipped Email

```bash
# Replace order_01JKXXX with actual order ID
curl -X POST http://localhost:9000/admin/orders/order_01JKXXX/ship \
  -H "Authorization: Bearer your_token" \
  -H "Content-Type: application/json" \
  -d '{
    "tracking_number": "TEST123",
    "tracking_url": "https://example.com/track/TEST123",
    "carrier": "Test Courier"
  }'
```

### Test Order Delivered Email

```bash
# Replace order_01JKXXX with actual order ID
curl -X POST http://localhost:9000/admin/orders/order_01JKXXX/deliver \
  -H "Authorization: Bearer your_token" \
  -H "Content-Type: application/json" \
  -d '{}'
```

---

## Troubleshooting

### Email Not Received

1. **Check Spam Folder**: Ask customer to check spam/junk folder
2. **Verify Email Address**: Ensure customer's email is correct in order
3. **Check Logs**: Look at backend logs for errors
4. **Resend**: You can call the API again to resend

### Wrong Information Sent

1. **Cannot Edit Sent Email**: Once sent, email cannot be changed
2. **Send Correction**: Contact customer directly via phone/Facebook
3. **Resend with Correct Info**: You can send another email with updated info

### Customer Didn't Get Tracking Info

1. **Resend Ship Email**: Call the ship API again with correct tracking info
2. **Send Manually**: Send tracking info via Facebook/SMS as backup

---

## Best Practices

### ✅ DO:

- Send "Order Shipped" email as soon as you have tracking number
- Include accurate tracking information
- Send "Order Delivered" email after confirming delivery
- Double-check tracking numbers before sending
- Keep tracking URLs up to date

### ❌ DON'T:

- Send "Order Shipped" without tracking information
- Send "Order Delivered" before actual delivery
- Use incorrect carrier names
- Forget to include tracking URL
- Send multiple ship emails for same order (unless correcting mistake)

---

## Quick Command Reference

### Ship Order (with tracking)

```bash
POST /admin/orders/{id}/ship
{
  "tracking_number": "ABC123",
  "tracking_url": "https://track.example.com/ABC123",
  "carrier": "LBC Express"
}
```

### Ship Order (without tracking)

```bash
POST /admin/orders/{id}/ship
{
  "carrier": "LBC Express"
}
```

### Deliver Order

```bash
POST /admin/orders/{id}/deliver
{}
```

---

## Need Help?

**Technical Issues**: Check backend logs or contact developer  
**Customer Questions**: Use contact info in emails (0995 093 0157 or Facebook)  
**Email Not Working**: Verify Resend API key and domain verification

---

**Last Updated**: February 6, 2026  
**Version**: 1.0
