import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Package,
  Truck,
  CheckCircle,
  Clock,
  XCircle,
  ClipboardList,
} from "lucide-react";
import { toast } from "react-toastify";
import { useCookies } from "react-cookie";

interface Variant {
  weight?: string;
  type?: string;
  packaging?: string;
}

interface Product {
  _id: string;
  name: string;
  images: string[];
  price: number;
  quantity: number;
  variant: Variant;
}

interface ShippingAddress {
  fullName: string;
  city: string;
  state: string;
  postalCode: string;
}

interface Order {
  _id: string;
  products: Product[];
  totalAmount: number;
  status: string;
  paymentType: string;
  createdAt: string;
  shippingAddress: ShippingAddress;
}

const statusOrder = ["Placed", "Processing", "Shipped", "Delivered", "Cancelled"];

const OrderForAdmin: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [cookies] = useCookies(["token", "role"]);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const ordersPerPage = 10;

  // Fetch all orders
  const fetchOrders = async () => {
    try {
      const token = cookies.token;
      const res = await axios.get("http://localhost:3005/api/orders/admin/all", {
        headers: { Authorization: token ? `Bearer ${token}` : "" },
      });
      if (Array.isArray(res.data)) {
        setOrders(res.data);
      } else {
        setOrders([]);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to fetch orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // Update order status
  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    try {
      setUpdating(orderId);
      const token = cookies.token;
      const { data } = await axios.put(
        `http://localhost:3005/api/orders/admin/${orderId}/status`,
        { status: newStatus },
        { headers: { Authorization: token ? `Bearer ${token}` : "" } }
      );

      toast.success("Order status updated!");
      setOrders((prev) =>
        prev.map((order) =>
          order._id === orderId ? { ...order, status: data.order.status } : order
        )
      );
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update status");
    } finally {
      setUpdating(null);
    }
  };

  // Compute counts safely
  const statusCounts = React.useMemo(() => {
    if (!Array.isArray(orders)) {
      return {
        total: 0,
        Placed: 0,
        Processing: 0,
        Shipped: 0,
        Delivered: 0,
        Cancelled: 0,
      };
    }

    return orders.reduce(
      (acc, order) => {
        acc.total++;
        acc[order.status] = (acc[order.status] || 0) + 1;
        return acc;
      },
      {
        total: 0,
        Placed: 0,
        Processing: 0,
        Shipped: 0,
        Delivered: 0,
        Cancelled: 0,
      } as Record<string, number>
    );
  }, [orders]);

  // Pagination logic
  const indexOfLastOrder = currentPage * ordersPerPage;
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
  const currentOrders = orders.slice(indexOfFirstOrder, indexOfLastOrder);
  const totalPages = Math.ceil(orders.length / ordersPerPage);

  // Loader
  if (loading) {
    return (
      <div className="flex justify-center items-center h-[60vh] text-amber-600">
        <Clock className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  // Empty orders case
  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-gray-600">
        <ClipboardList className="w-10 h-10 mb-3 text-gray-400" />
        <p>No orders found.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-6 text-gray-800">
        Orders Dashboard
      </h1>

      {/* --- Summary Cards --- */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <SummaryCard
          icon={<ClipboardList className="text-blue-500" />}
          label="Total"
          count={statusCounts.total}
          color="bg-blue-50"
        />
        <SummaryCard
          icon={<Clock className="text-amber-500" />}
          label="Placed"
          count={statusCounts.Placed}
          color="bg-amber-50"
        />
        <SummaryCard
          icon={<Package className="text-purple-500" />}
          label="Processing"
          count={statusCounts.Processing}
          color="bg-purple-50"
        />
        <SummaryCard
          icon={<Truck className="text-sky-500" />}
          label="Shipped"
          count={statusCounts.Shipped}
          color="bg-sky-50"
        />
        <SummaryCard
          icon={<CheckCircle className="text-green-500" />}
          label="Delivered"
          count={statusCounts.Delivered}
          color="bg-green-50"
        />
        <SummaryCard
          icon={<XCircle className="text-red-500" />}
          label="Cancelled"
          count={statusCounts.Cancelled}
          color="bg-red-50"
        />
      </div>

      {/* --- Orders Table --- */}
      <div className="bg-white border rounded-2xl shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead className="bg-gray-100 text-gray-700 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Order ID</th>
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Items</th>
                <th className="px-4 py-3 font-medium">Amount</th>
                <th className="px-4 py-3 font-medium">Payment</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {currentOrders.map((order) => (
                <tr
                  key={order._id}
                  className="border-t hover:bg-gray-50 transition duration-150"
                >
                  <td className="px-4 py-3 text-gray-700 font-medium">
                    #{order._id.slice(-6).toUpperCase()}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {order.shippingAddress.fullName}
                    <p className="text-xs text-gray-400">
                      {order.shippingAddress.city}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {order.products.length} item(s)
                  </td>
                  <td className="px-4 py-3 font-semibold text-gray-800">
                    ₹{order.totalAmount}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {order.paymentType}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        order.status === "Shipped"
                          ? "bg-sky-100 text-sky-700"
                          : order.status === "Delivered"
                          ? "bg-green-100 text-green-700"
                          : order.status === "Processing"
                          ? "bg-purple-100 text-purple-700"
                          : order.status === "Cancelled"
                          ? "bg-red-100 text-red-700"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {order.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      className="border rounded-md px-2 py-1 text-sm"
                      value={order.status}
                      disabled={updating === order._id}
                      onChange={(e) =>
                        handleStatusUpdate(order._id, e.target.value)
                      }
                    >
                      {statusOrder.map((status) => {
                        const currentIndex = statusOrder.indexOf(order.status);
                        const optionIndex = statusOrder.indexOf(status);

                        // Disable the option if it is lower than current status
                        const disabled = optionIndex < currentIndex && status !== "Cancelled";

                        return (
                          <option key={status} value={status} disabled={disabled}>
                            {status}
                          </option>
                        );
                      })}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- Pagination Controls --- */}
      <div className="flex justify-center mt-4 space-x-2">
        <button
          className="px-1 py-1 border rounded-md"
          disabled={currentPage === 1}
          onClick={() => setCurrentPage((prev) => prev - 1)}
        >
          Prev
        </button>

        {Array.from({ length: totalPages }, (_, i) => (
          <button
            key={i + 1}
            className={`px-2 py-1 border rounded-md ${
              currentPage === i + 1 ? "bg-blue-500 text-white" : ""
            }`}
            onClick={() => setCurrentPage(i + 1)}
          >
            {i + 1}
          </button>
        ))}

        <button
          className="px-1 py-1 border rounded-md"
          disabled={currentPage === totalPages}
          onClick={() => setCurrentPage((prev) => prev + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
};

interface SummaryCardProps {
  icon: React.ReactNode;
  label: string;
  count: number;
  color: string;
}

const SummaryCard: React.FC<SummaryCardProps> = ({
  icon,
  label,
  count,
  color,
}) => (
  <div
    className={`flex flex-col items-center justify-center rounded-xl ${color} py-4`}
  >
    <div className="mb-1">{icon}</div>
    <p className="text-sm font-medium text-gray-700">{label}</p>
    <p className="text-lg font-semibold text-gray-800">{count}</p>
  </div>
);

export default OrderForAdmin;
