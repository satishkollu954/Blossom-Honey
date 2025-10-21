import React, { useEffect, useState } from "react";
import axios from "axios";
import { Edit, Trash2, Plus } from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import { useCookies } from "react-cookie";

interface Advertisement {
  _id?: string;
  title: string;
  description?: string;
  images: string[]; // existing URLs
  link?: string;
  position: string;
  startDate?: string;
  endDate?: string;
  isActive: boolean;
}

export default function AdvertisementManager() {
  const [ads, setAds] = useState<Advertisement[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingAd, setEditingAd] = useState<Advertisement | null>(null);
  const [loading, setLoading] = useState(false);
  const [cookies] = useCookies(["token"]);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const positions = ["homepage", "sidebar", "banner", "popup", "footer"];

  const API_URL = import.meta.env.VITE_API_BASE_URL;

  // formData now separates existing images and new uploaded files
  const [formData, setFormData] = useState<
    Advertisement & { newFiles?: File[] }
  >({
    title: "",
    description: "",
    images: [],
    newFiles: [],
    link: "",
    position: positions[0],
    startDate: "",
    endDate: "",
    isActive: true,
  });

  // Fetch all ads
  const fetchAds = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/advertisements`, {
        headers: { Authorization: `Bearer ${cookies.token}` },
      });
      setAds(res.data);
    } catch (error) {
      console.error(error);
      toast.error("Failed to fetch advertisements");
    }
  };

  useEffect(() => {
    fetchAds();
  }, []);

  // Handle input changes
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    const newValue = type === "checkbox" ? (e.target as HTMLInputElement).checked : value;

    setFormData((prev) => ({
      ...prev,
      [name]: newValue,
    }));
  };

  // Handle new file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return; // ✅ guard clause

    setFormData((prev) => ({
      ...prev,
      newFiles: Array.from(files), // ✅ now TypeScript is happy
    }));
  };


  // Submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return toast.error("Title is required");

    const data = new FormData();
    data.append("title", formData.title);
    data.append("description", formData.description || "");
    data.append("link", formData.link || "");
    data.append("position", formData.position);
    data.append("isActive", JSON.stringify(formData.isActive));
    if (formData.startDate) data.append("startDate", formData.startDate);
    if (formData.endDate) data.append("endDate", formData.endDate);

    // Append new files only
    formData.newFiles?.forEach((file) => data.append("advertisementImages", file));

    setLoading(true);
    try {
      if (editingAd) {
        await axios.put(
          `${API_URL}/api/advertisements/${editingAd._id}`,
          data,
          { headers: { Authorization: `Bearer ${cookies.token}` } }
        );
        toast.success("Advertisement updated successfully!");
      } else {
        await axios.post(`${API_URL}/api/advertisements`, data, {
          headers: { Authorization: `Bearer ${cookies.token}` },
        });
        toast.success("Advertisement created successfully!");
      }
      setShowModal(false);
      setEditingAd(null);
      fetchAds();
    } catch (error) {
      console.error(error);
      toast.error("Failed to save advertisement");
    } finally {
      setLoading(false);
    }
  };

  // Edit ad
  const handleEdit = (ad: Advertisement) => {
    setEditingAd(ad);
    setFormData({
      ...ad,
      newFiles: [],
      startDate: ad.startDate ? ad.startDate.split("T")[0] : "",
      endDate: ad.endDate ? ad.endDate.split("T")[0] : "",
    });
    setShowModal(true);
  };
  const today = new Date().toISOString().split("T")[0]; // "YYYY-MM-DD"


  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      <ToastContainer position="top-right" autoClose={1500} />

      {/* Header + Add Button */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-3">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800 text-center sm:text-left">
          📢 Advertisement Management
        </h1>
        <button
          onClick={() => {
            setFormData({
              title: "",
              description: "",
              images: [],
              newFiles: [],
              link: "",
              position: positions[0],
              startDate: "",
              endDate: "",
              isActive: true,
            });
            setEditingAd(null);
            setShowModal(true);
          }}
          className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 w-full sm:w-auto"
        >
          <Plus size={18} /> Add Advertisement
        </button>
      </div>

      {/* Advertisement Table */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
        {ads.length > 0 ? (
          ads.map((ad) => (
            <div
              key={ad._id}
              className={`bg-white shadow-lg rounded-xl border border-gray-200 p-4 flex flex-col justify-between transition hover:shadow-xl ${!ad.isActive ? "opacity-60" : ""
                }`}
            >
              <div className="mb-4">
                <h2 className="text-lg font-bold text-gray-800">{ad.title}</h2>
                <p className="text-gray-700">{ad.description}</p>
                <p className="text-sm text-gray-500">Position: {ad.position}</p>
                {ad.link && (
                  <p className="text-sm text-blue-600 underline">
                    <a href={ad.link} target="_blank" rel="noopener noreferrer">
                      {ad.link}
                    </a>
                  </p>
                )}
                <p className="text-sm text-gray-500">
                  Start: {ad.startDate ? new Date(ad.startDate).toLocaleDateString() : "-"}
                </p>
                <p className="text-sm text-gray-500">
                  End: {ad.endDate ? new Date(ad.endDate).toLocaleDateString() : "-"}
                </p>
              </div>

              {/* Status & Actions */}
              <div className="flex items-center justify-between mt-auto">
                <span
                  className={`px-2 py-1 text-xs rounded-full font-semibold ${ad.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                    }`}
                >
                  {ad.isActive ? "Active" : "Inactive"}
                </span>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(ad)}
                    className="p-2 text-blue-600 hover:bg-blue-100 rounded-full"
                  >
                    <Edit size={18} />
                  </button>
                  <button
                    onClick={() => {
                      setDeleteId(ad._id!);
                      setShowDeleteModal(true);
                    }}
                    className="p-2 text-red-600 hover:bg-red-100 rounded-full"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <p className="col-span-full text-center text-gray-500 py-6 italic">
            No advertisements available
          </p>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
          <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-md sm:max-w-lg overflow-y-auto max-h-[90vh]">
            <h2 className="text-lg sm:text-xl font-bold mb-4 text-gray-800">
              {editingAd ? "Edit Advertisement" : "Add Advertisement"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block font-medium mb-1 text-sm">Title</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className="w-full border rounded-lg px-3 py-2"
                  required
                />
              </div>

              <div>
                <label className="block font-medium mb-1 text-sm">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>

              <div>
                <label className="block font-medium mb-1 text-sm">Link</label>
                <input
                  type="text"
                  name="link"
                  value={formData.link}
                  onChange={handleChange}
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>

              <div>
                <label className="block font-medium mb-1 text-sm">Position</label>
                <select
                  name="position"
                  value={formData.position}
                  onChange={handleChange}
                  className="w-full border rounded-lg px-3 py-2"
                >
                  {positions.map((pos) => (
                    <option key={pos} value={pos}>
                      {pos}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium mb-1 text-sm">Images</label>
                <input
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  className="w-full mb-2"
                />

                {/* Preview existing images */}
                <div className="flex flex-wrap gap-2 mb-2">
                  {formData.images?.map((url, idx) => (
                    <img
                      key={idx}
                      src={url}
                      alt="existing"
                      className="w-20 h-20 object-cover rounded-md border"
                    />
                  ))}

                  {/* Preview newly selected files */}
                  {formData.newFiles?.map((file, idx) => (
                    <img
                      key={idx}
                      src={URL.createObjectURL(file)}
                      alt="preview"
                      className="w-20 h-20 object-cover rounded-md border"
                    />
                  ))}
                </div>
              </div>


              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium mb-1 text-sm">Start Date</label>
                  <input
                    type="date"
                    name="startDate"
                    value={formData.startDate}
                    min={today}
                    onChange={handleChange}
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1 text-sm">End Date</label>
                  <input
                    type="date"
                    name="endDate"
                    value={formData.endDate}
                    min={today}
                    onChange={handleChange}
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleChange}
                />
                <label className="text-sm">Active</label>
              </div>

              <div className="flex flex-col sm:flex-row justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg w-full sm:w-auto"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg w-full sm:w-auto"
                >
                  {loading ? "Saving..." : editingAd ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Confirm Delete</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this advertisement? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (!deleteId) return;
                  try {
                    await axios.delete(`${API_URL}/api/advertisements/${deleteId}`, {
                      headers: { Authorization: `Bearer ${cookies.token}` },
                    });
                    toast.success("Advertisement deleted successfully!");
                    fetchAds();
                  } catch (error) {
                    console.error(error);
                    toast.error("Failed to delete advertisement");
                  } finally {
                    setShowDeleteModal(false);
                    setDeleteId(null);
                  }
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
