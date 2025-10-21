import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Package,
  Truck,
  CheckCircle,
  Clock,
  XCircle,
  ClipboardList,
  Loader2,
  Search, // Added Search icon
} from "lucide-react";
import { toast } from "react-toastify";
import { useCookies } from "react-cookie";

// --- INTERFACES (UNCHANGED) ---
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

// --- CONSTANTS (UNCHANGED) ---
const statusOrder = ["Placed", "Processing", "Shipped", "Delivered", "Cancelled"];

// --- HELPER COMPONENTS (UNCHANGED) ---

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
    className={`flex flex-col items-center justify-center rounded-xl ${color} p-3 sm:p-4`}
  >
    <div className="mb-1">{icon}</div>
    <p className="text-xs font-medium text-gray-700">{label}</p>
    <p className="text-lg font-bold text-gray-800">{count}</p>
  </div>
);

interface OrderRowMobileProps {
  order: Order;
  handleStatusUpdate: (orderId: string, newStatus: string) => void;
  updating: string | null;
}

const OrderRowMobile: React.FC<OrderRowMobileProps> = ({
  order,
  handleStatusUpdate,
  updating,
}) => {
  const statusColor = (status: string) => {
    switch (status) {
      case "Shipped":
        return "bg-sky-100 text-sky-700";
      case "Delivered":
        return "bg-green-100 text-green-700";
      case "Processing":
        return "bg-purple-100 text-purple-700";
      case "Cancelled":
        return "bg-red-100 text-red-700";
      default:
        return "bg-amber-100 text-amber-700";
    }
  };

  const isUpdating = updating === order._id;
  const statusBadge = (
    <span
      className={`px-3 py-1 rounded-full text-xs font-medium ${statusColor(
        order.status
      )}`}
    >
      {order.status}
    </span>
  );

  const StatusSelect = (
    <div className="flex items-center space-x-2">
      <select
        className="border rounded-md px-2 py-1 text-sm bg-white"
        value={order.status}
        disabled={isUpdating}
        onChange={(e) => handleStatusUpdate(order._id, e.target.value)}
      >
        {statusOrder.map((status) => {
          const currentIndex = statusOrder.indexOf(order.status);
          const optionIndex = statusOrder.indexOf(status);
          const disabled = optionIndex < currentIndex && status !== "Cancelled";

          return (
            <option key={status} value={status} disabled={disabled}>
              {status}
            </option>
          );
        })}
      </select>
      {isUpdating && <Loader2 className="w-4 h-4 animate-spin text-blue-500" />}
    </div>
  );

  return (
    <div className="border-b p-4 grid grid-cols-2 gap-3 text-sm last:border-b-0">
      <div className="font-semibold text-gray-800 flex flex-col">
        <span className="text-xs font-normal text-gray-500">Order ID</span>
        <span className="truncate">#{order._id.slice(-6).toUpperCase()}</span>
      </div>
      <div className="font-semibold text-gray-800 flex flex-col items-end">
        <span className="text-xs font-normal text-gray-500">Amount</span>
        <span className="text-base font-bold">₹{order.totalAmount}</span>
      </div>
      <div className="col-span-2 text-gray-600 flex flex-col">
        <span className="text-xs font-normal text-gray-500">Customer</span>
        {order.shippingAddress.fullName}
        <p className="text-xs text-gray-400">
          {order.shippingAddress.city}, {order.shippingAddress.state}
        </p>
      </div>
      <div className="text-gray-600 flex flex-col">
        <span className="text-xs font-normal text-gray-500">Items</span>
        {order.products.length} item(s)
      </div>
      <div className="text-gray-600 flex flex-col">
        <span className="text-xs font-normal text-gray-500">Payment</span>
        {order.paymentType}
      </div>
      <div className="text-gray-600 flex flex-col">
        <span className="text-xs font-normal text-gray-500">Status</span>
        {statusBadge}
      </div>
      <div className="col-span-2 text-gray-600 flex flex-col">
        <span className="text-xs font-normal text-gray-500">Action</span>
        {StatusSelect}
      </div>
    </div>
  );
};

// --- MAIN COMPONENT ---
const OrderForAdmin: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [cookies] = useCookies(["token", "role"]);

  // New state for search functionality
  const [searchTerm, setSearchTerm] = useState("");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const ordersPerPage = 10;

  // --- FETCH ORDERS (UNCHANGED) ---
  const fetchOrders = async () => {
    // ... (fetch logic remains the same)
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

  // --- UPDATE STATUS (UNCHANGED) ---
  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    // ... (update logic remains the same)
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

  // --- FILTERED ORDERS LOGIC (NEW) ---
  const filteredOrders = React.useMemo(() => {
    if (!searchTerm) {
      return orders;
    }

    const lowerCaseSearch = searchTerm.toLowerCase();

    return orders.filter((order) => {
      const customerName = order.shippingAddress.fullName.toLowerCase();
      // Use the last 6 characters of the MongoDB ID for searching
      const orderIdSuffix = order._id.slice(-6).toLowerCase();

      // Check if the search term matches the customer name or the order ID suffix
      return (
        customerName.includes(lowerCaseSearch) ||
        orderIdSuffix.includes(lowerCaseSearch)
      );
    });
  }, [orders, searchTerm]);


  // --- STATUS COUNTS (UPDATED to use filteredOrders for relevant counts) ---
  const statusCounts = React.useMemo(() => {
    if (!Array.isArray(filteredOrders)) {
      return {
        total: 0,
        Placed: 0,
        Processing: 0,
        Shipped: 0,
        Delivered: 0,
        Cancelled: 0,
      };
    }

    return filteredOrders.reduce(
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
  }, [filteredOrders]); // Dependency changed to filteredOrders

  // --- PAGINATION LOGIC (UPDATED to use filteredOrders) ---
  // Reset to page 1 whenever the filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const indexOfLastOrder = currentPage * ordersPerPage;
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
  const currentOrders = filteredOrders.slice(indexOfFirstOrder, indexOfLastOrder); // Slicing filtered orders
  const totalPages = Math.ceil(filteredOrders.length / ordersPerPage); // Total pages based on filtered count

  // --- LOADER & EMPTY CASE (UPDATED to handle 'no results') ---
  if (loading) {
    return (
      <div className="flex justify-center items-center h-[60vh] text-amber-600">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  // Handle the case where no orders are loaded at all
  if (orders.length === 0 && !loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-gray-600">
        <ClipboardList className="w-10 h-10 mb-3 text-gray-400" />
        <p>No orders found.</p>
      </div>
    );
  }

  // Handle the case where orders are filtered down to zero
  const isNoResults = filteredOrders.length === 0 && searchTerm !== "";

  // --- RENDER BLOCK ---
  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 min-h-screen">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">
        Orders Dashboard
      </h1>

      {/* --- Search Input (NEW) --- */}
      <div className="mb-6 relative">
        <input
          type="text"
          placeholder="Search by Order ID or Customer Name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-amber-500 focus:border-amber-500 transition duration-150"
        />
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
      </div>

      {/* --- Summary Cards: Responsive Grid --- */}
      <div className="grid grid-cols-2 xs:grid-cols-3 md:grid-cols-6 gap-3 sm:gap-4 mb-8">
        {/* Updated Summary Cards will now reflect counts based on filtered orders */}
        <SummaryCard
          icon={<ClipboardList className="text-blue-500 w-5 h-5 sm:w-6 sm:h-6" />}
          label="Total"
          count={statusCounts.total}
          color="bg-blue-50"
        />
        <SummaryCard
          icon={<Clock className="text-amber-500 w-5 h-5 sm:w-6 sm:h-6" />}
          label="Placed"
          count={statusCounts.Placed}
          color="bg-amber-50"
        />
        <SummaryCard
          icon={<Package className="text-purple-500 w-5 h-5 sm:w-6 sm:h-6" />}
          label="Processing"
          count={statusCounts.Processing}
          color="bg-purple-50"
        />
        <SummaryCard
          icon={<Truck className="text-sky-500 w-5 h-5 sm:w-6 sm:h-6" />}
          label="Shipped"
          count={statusCounts.Shipped}
          color="bg-sky-50"
        />
        <SummaryCard
          icon={<CheckCircle className="text-green-500 w-5 h-5 sm:w-6 sm:h-6" />}
          label="Delivered"
          count={statusCounts.Delivered}
          color="bg-green-50"
        />
        <SummaryCard
          icon={<XCircle className="text-red-500 w-5 h-5 sm:w-6 sm:h-6" />}
          label="Cancelled"
          count={statusCounts.Cancelled}
          color="bg-red-50"
        />
      </div>

      {isNoResults && (
        <div className="text-center py-10 text-gray-500">
          <p className="font-medium">No orders match your search criteria.</p>
          <p className="text-sm">Try searching by a full name or the last 6 digits of the Order ID.</p>
        </div>
      )}

      {/* --- Orders Table: Desktop View (visible on screens larger than sm) --- */}
      {!isNoResults && (
        <>
          <div className="bg-white border rounded-2xl shadow-sm hidden sm:block">
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse text-sm">
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
                        {order._id.slice(-6).toUpperCase()}
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
                          className={`px-3 py-1 rounded-full text-xs font-medium ${order.status === "Shipped"
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

                            const disabled =
                              optionIndex < currentIndex && status !== "Cancelled";

                            return (
                              <option
                                key={status}
                                value={status}
                                disabled={disabled}
                              >
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

          {/* --- Orders List: Mobile View (visible on screens smaller than sm) --- */}
          <div className="bg-white border rounded-2xl shadow-sm sm:hidden divide-y divide-gray-100">
            {currentOrders.map((order) => (
              <OrderRowMobile
                key={order._id}
                order={order}
                handleStatusUpdate={handleStatusUpdate}
                updating={updating}
              />
            ))}
          </div>

          {/* --- Pagination Controls (Adjusted for mobile) --- */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center mt-6 space-x-2 text-sm">
              <button
                className="px-3 py-1 border rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition duration-150"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((prev) => prev - 1)}
              >
                Prev
              </button>

              <span className="px-3 py-1 text-gray-700 font-medium">
                Page {currentPage} of {totalPages}
              </span>

              <button
                className="px-3 py-1 border rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition duration-150"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((prev) => prev + 1)}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default OrderForAdmin;