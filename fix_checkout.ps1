$path = "c:\Users\91704\OneDrive\Desktop\QickCommerce\frontend\src\modules\user\Checkout.tsx"
# Read as UTF8 to be safe
$content = [System.IO.File]::ReadAllText($path)

# Update COD Subtext
$content = $content.Replace("(Pay when you receive)", "(75% at delivery)")

# Update Razorpay amount
$content = $content.Replace("amount={payableAmount}", "amount={paymentMethod === 'COD' ? (payableAmount * 0.25) : payableAmount}")

# Update Place Order button text
$content = $content.Replace("Place Order", '{paymentMethod === "COD" && payableAmount > 0 ? `Pay ₹${(payableAmount * 0.25).toLocaleString("en-IN")} & Confirm Order` : "Place Order"}')

# Save back
[System.IO.File]::WriteAllText($path, $content)
