import React, { useEffect, useState } from 'react';
import { IDeal as BackendIDeal } from '../../../backend/src/models/Deal'; // Adjust path
import { getAllDeals, deleteDeal } from '../../services/dealService';
import { Link } from 'react-router-dom'; // Assuming you use React Router

export interface IDeal extends BackendIDeal {
  stageColor?: string;
}

const DealList: React.FC = () => {
  const [deals, setDeals] = useState<IDeal[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);

  const fetchDeals = async (page: number = 1) => {
    setLoading(true);
    setError(null);
    try {
      const response = await getAllDeals({ page, limit: 10, sortBy: 'createdAt', sortOrder: 'desc' });
      if (response.success && response.data) {
        setDeals(response.data);
        setPagination(response.pagination);
      } else {
        setError(response.error || 'Failed to fetch deals');
      }
    } catch (err) {
      setError('An unexpected error occurred.');
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchDeals(currentPage);
  }, [currentPage]);

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this deal?')) {
      try {
        const response = await deleteDeal(id);
        if (response.success) {
          setDeals(deals.filter(deal => deal._id !== id));
          alert('Deal deleted successfully!');
        } else {
          alert(response.error || 'Failed to delete deal.');
        }
      } catch (err) {
        alert('An unexpected error occurred while deleting.');
      }
    }
  };

  if (loading) return <div className="text-center p-8">Loading deals...</div>;
  if (error) return <div className="text-center p-8 text-red-500">Error: {error}</div>;

  return (
    <div className="container mx-auto p-4 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Deals Management</h1>
        <Link 
          to="/deals/new" 
          className="bg-primary-500 hover:bg-primary-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition duration-150 ease-in-out"
        >
          Create New Deal
        </Link>
      </div>

      {deals.length === 0 && !loading && (
        <div className="text-center text-gray-500 py-10">
          <p className="text-xl">No deals found.</p>
          <p>Start by creating a new deal!</p>
        </div>
      )}

      {deals.length > 0 && (
        <div className="bg-white shadow-xl rounded-lg overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Deal Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Company</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Stage</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Value (THB)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Assigned To</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {deals.map((deal) => (
                <tr key={deal._id} className="hover:bg-gray-50 transition duration-150">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Link to={`/deals/${deal._id}`} className="text-primary-600 hover:text-primary-800 font-semibold">
                      {deal.dealName}
                    </Link>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{deal.companyName}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span 
                      className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full"
                      style={{ backgroundColor: deal.stageColor, color: 'white' }}
                    >
                      {deal.dealStage}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{deal.dealValue.toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {deal.assignedTo ? (deal.assignedTo as any).name : 'Unassigned'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <Link to={`/deals/edit/${deal._id}`} className="text-indigo-600 hover:text-indigo-900 mr-3">Edit</Link>
                    <button 
                      onClick={() => handleDelete(deal._id)} 
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pagination && pagination.total > 1 && (
        <div className="mt-6 flex justify-center items-center space-x-2">
          <button 
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} 
            disabled={currentPage === 1}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white rounded-md border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
          >
            Previous
          </button>
          {[...Array(pagination.total)].map((_, i) => (
            <button 
              key={i + 1} 
              onClick={() => setCurrentPage(i + 1)} 
              className={`px-4 py-2 text-sm font-medium rounded-md border ${currentPage === i + 1 ? 'bg-primary-500 text-white border-primary-500' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
            >
              {i + 1}
            </button>
          ))}
          <button 
            onClick={() => setCurrentPage(prev => Math.min(pagination.total, prev + 1))} 
            disabled={currentPage === pagination.total}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white rounded-md border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default DealList; 