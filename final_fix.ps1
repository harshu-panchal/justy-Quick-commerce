$path = "c:\Users\91704\OneDrive\Desktop\QickCommerce\frontend\src\modules\user\Checkout.tsx"
$content = [System.IO.File]::ReadAllText($path)

# 1. Update Place Order button text (uniquely in the bottom sticky div)
$oldButton = '              Place Order'
$newButton = '              {paymentMethod === "COD" && payableAmount > 0 ? `Pay ₹${(payableAmount * 0.25).toLocaleString("en-IN")} & Confirm Order` : "Place Order"}'
# Use a very specific replacement to avoid affecting other strings if any
$content = $content.Replace($oldButton, $newButton)

# 2. Add Partial COD Info Message after the payment method grid
$oldGridEnd = '              </button>
            </div>'
$infoMessage = '
            {/* Partial COD Info Message */}
            {paymentMethod === "COD" && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-3 p-3 bg-blue-50 border border-blue-100 rounded-xl"
              >
                <p className="text-[10px] text-blue-700 font-medium leading-relaxed">
                  <span className="font-bold">Partial COD:</span> To confirm your COD order, you need to pay 25% in advance online. The remaining 75% will be paid at delivery.
                </p>
                <div className="mt-2 pt-2 border-t border-blue-100 flex justify-between gap-4">
                  <div className="flex flex-col">
                    <span className="text-[9px] text-blue-600 font-semibold uppercase">Advance (25%)</span>
                    <span className="text-xs font-black text-blue-800">₹{(payableAmount * 0.25).toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex flex-col text-right">
                    <span className="text-[9px] text-blue-600 font-semibold uppercase">Remaining (75%)</span>
                    <span className="text-xs font-black text-blue-800">₹{(payableAmount * 0.75).toLocaleString("en-IN")}</span>
                  </div>
                </div>
              </motion.div>
            )}'
$content = $content.Replace($oldGridEnd, $oldGridEnd + $infoMessage)

[System.IO.File]::WriteAllText($path, $content)
