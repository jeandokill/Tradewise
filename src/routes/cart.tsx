import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight } from "lucide-react";
import { useCart } from "@/lib/cart";
import { toast } from "sonner";
import { formatRWF } from "@/lib/currency";

export const Route = createFileRoute("/cart")({
  head: () => ({ meta: [{ title: "Cart — Tradewise" }] }),
  component: CartPage,
});

function CartPage() {
  const { items, setQty, remove, clear, total } = useCart();
  const nav = useNavigate();

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-24 text-center">
        <ShoppingBag className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
        <h1 className="text-3xl font-bold">Your cart is empty</h1>
        <p className="text-muted-foreground mt-2">Browse our catalog to get started.</p>
        <Link to="/categories" className="mt-6 inline-flex px-6 py-3 rounded-md bg-primary text-primary-foreground font-semibold">Shop Now</Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-3xl md:text-4xl font-bold mb-8">Your Cart</h1>
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {items.map((i) => (
            <div key={i.id} className="flex flex-col sm:flex-row gap-4 p-4 bg-card rounded-xl shadow-card">
              <img src={i.image} alt={i.name} className="w-full sm:w-28 h-28 object-contain bg-secondary/30 rounded-lg" />
              <div className="flex-1 flex flex-col">
                <h3 className="font-semibold">{i.name}</h3>
                <p className="text-primary font-bold mt-1">{formatRWF(i.price)}</p>
                <div className="mt-auto flex items-center justify-between">
                  <div className="inline-flex items-center border border-border rounded-md">
                    <button onClick={() => setQty(i.id, i.qty - 1)} className="h-9 w-9 inline-flex items-center justify-center hover:bg-secondary"><Minus className="h-3.5 w-3.5" /></button>
                    <span className="w-10 text-center text-sm font-medium">{i.qty}</span>
                    <button onClick={() => setQty(i.id, i.qty + 1)} className="h-9 w-9 inline-flex items-center justify-center hover:bg-secondary"><Plus className="h-3.5 w-3.5" /></button>
                  </div>
                  <button onClick={() => { remove(i.id); toast.success("Removed"); }} className="inline-flex items-center gap-1 text-destructive text-sm hover:underline">
                    <Trash2 className="h-4 w-4" /> Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
          <button onClick={() => { clear(); toast.success("Cart cleared"); }} className="text-sm text-muted-foreground hover:text-destructive">Clear cart</button>
        </div>
        <div className="bg-card rounded-xl shadow-card p-6 h-fit sticky top-24">
          <h2 className="text-xl font-bold mb-4">Order Summary</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatRWF(total)}</span></div>
            <div className="border-t border-border pt-3 mt-3 flex justify-between text-lg font-bold"><span>Total</span><span className="text-primary">{formatRWF(total)}</span></div>
          </div>
          <button onClick={() => nav({ to: "/checkout" })} className="mt-5 w-full inline-flex items-center justify-center gap-2 py-3 rounded-md bg-gradient-brand text-white font-semibold hover:opacity-90">
            Proceed to checkout <ArrowRight className="h-4 w-4" />
          </button>
          <div className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <span className="px-2 py-1 rounded bg-yellow-500 text-black font-bold">MoMo</span>
            <span className="px-2 py-1 rounded bg-red-600 text-white font-bold">Airtel</span>
            <span className="px-2 py-1 rounded bg-blue-700 text-white font-bold">Bank</span>
          </div>
        </div>
      </div>
    </div>
  );
}
