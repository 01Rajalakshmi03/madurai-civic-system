import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { FiUpload, FiImage, FiX, FiCheckCircle, FiAlertCircle, FiLoader } from 'react-icons/fi';
import { complaintAPI } from '../../utils/api';

const categories = [
  { value: 'road_damage', label: 'Road Damage' },
  { value: 'garbage_accumulation', label: 'Garbage Accumulation' },
  { value: 'water_leakage', label: 'Water Leakage' },
  { value: 'drainage_problem', label: 'Drainage Problem' },
  { value: 'streetlight_failure', label: 'Streetlight Failure' },
  { value: 'illegal_dumping', label: 'Illegal Dumping' },
  { value: 'infrastructure_damage', label: 'Infrastructure Damage' },
  { value: 'other', label: 'Other' },
];

export default function NewComplaint() {
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: {
      title: '',
      description: '',
      category: '',
      ward: '',
      latitude: '9.9252',
      longitude: '78.1198',
    },
  });

  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setImages((prev) => [...prev, ...files]);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews((prev) => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (data) => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const formData = new FormData();
      formData.append('title', data.title);
      formData.append('description', data.description);
      formData.append('category', data.category);
      formData.append('ward', data.ward);
      formData.append('location', JSON.stringify({
        type: 'Point',
        coordinates: [parseFloat(data.longitude), parseFloat(data.latitude)],
        address: 'Madurai'
      }));
      images.forEach((img) => formData.append('images', img));

      const res = await complaintAPI.create(formData);
      setSuccess(res.data?.complaint_id || res.complaint_id || 'Complaint submitted successfully');
      reset();
      setImages([]);
      setImagePreviews([]);
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.detail || err.message || 'Failed to submit complaint');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <FiAlertCircle className="text-primary-600 text-2xl" />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">File a New Complaint</h1>
      </div>

      {success && (
        <div className="glass-card flex items-center gap-3 p-4 border border-green-400/30 bg-green-500/10 rounded-xl">
          <FiCheckCircle className="text-green-500 text-xl shrink-0" />
          <div>
            <p className="font-semibold text-green-600 dark:text-green-400">Complaint Filed Successfully!</p>
            <p className="text-sm text-gray-600 dark:text-gray-300">Complaint ID: <span className="font-mono font-bold">{success}</span></p>
          </div>
          <button onClick={() => setSuccess(null)} className="ml-auto text-gray-400 hover:text-gray-600"><FiX /></button>
        </div>
      )}

      {error && (
        <div className="glass-card flex items-center gap-3 p-4 border border-red-400/30 bg-red-500/10 rounded-xl">
          <FiAlertCircle className="text-red-500 text-xl shrink-0" />
          <p className="text-red-600 dark:text-red-400">{error}</p>
          <button onClick={() => setError(null)} className="ml-auto text-gray-400 hover:text-gray-600"><FiX /></button>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="glass-card p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
          <input
            {...register('title', { required: 'Title is required' })}
            className="input-field w-full"
            placeholder="Brief description of the issue"
          />
          {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
          <textarea
            {...register('description', { required: 'Description is required' })}
            rows={4}
            className="input-field w-full resize-none"
            placeholder="Provide detailed information about the issue"
          />
          {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
            <select
              {...register('category', { required: 'Category is required' })}
              className="input-field w-full"
            >
              <option value="">Select a category</option>
              {categories.map((cat) => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
            {errors.category && <p className="text-red-500 text-xs mt-1">{errors.category.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ward Number</label>
            <input
              type="number"
              {...register('ward', { required: 'Ward number is required', min: { value: 1, message: 'Min 1' }, max: { value: 100, message: 'Max 100' } })}
              className="input-field w-full"
              placeholder="1 - 100"
            />
            {errors.ward && <p className="text-red-500 text-xs mt-1">{errors.ward.message}</p>}
          </div>
        </div>

        <div>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Location Coordinates</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Latitude</label>
              <input
                type="number"
                step="any"
                {...register('latitude', { required: true })}
                className="input-field w-full"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Longitude</label>
              <input
                type="number"
                step="any"
                {...register('longitude', { required: true })}
                className="input-field w-full"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Upload Images</label>
          <label className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl cursor-pointer hover:border-primary-500 transition-colors">
            <FiUpload className="text-gray-400" />
            <span className="text-sm text-gray-500 dark:text-gray-400">Click to upload images</span>
            <input type="file" multiple accept="image/*" onChange={handleImageChange} className="hidden" />
          </label>

          {imagePreviews.length > 0 && (
            <div className="grid grid-cols-3 gap-3 mt-4">
              {imagePreviews.map((src, idx) => (
                <div key={idx} className="relative group rounded-xl overflow-hidden">
                  <img src={src} alt="" className="w-full h-28 object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(idx)}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <FiX size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
          {loading ? <><FiLoader className="animate-spin" /> Submitting...</> : <><FiCheckCircle /> Submit Complaint</>}
        </button>
      </form>
    </div>
  );
}
