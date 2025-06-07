import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { IDeal as BackendIDeal } from '../../../backend/src/models/Deal'; 
import { 
  getDealById, 
  deleteDeal, 
  autoFillFromTranscription, 
  approveAISuggestions, 
  getDealSummary,
  ApiResponse, 
  SummarizationResult
} from '../../services/dealService';

// Define a more specific type for populated user/activity for frontend
interface PopulatedUser {
  _id: string;
  name?: string;
  email?: string;
}
interface PopulatedActivity {
  _id: string;
  title?: string;
  [key: string]: any; // Allow other activity fields
}

// Extend BackendIDeal for frontend use, making specific fields potentially strings (for display) 
// or ensuring they are optional if the form/display logic handles their absence.
export interface IDeal extends Omit<BackendIDeal, 'expectedCloseDate' | 'actualCloseDate' | 'lastRecordingDate' | 'createdAt' | 'updatedAt' | 'assignedTo' | 'createdBy' | 'relatedActivities' | 'aiSuggestions'> {
  expectedCloseDate?: string; // Dates as strings for input/display
  actualCloseDate?: string;
  lastRecordingDate?: string;
  createdAt?: string;
  updatedAt?: string;

  // For populated fields from backend, they might be objects. Define them if structure is known, else 'any'.
  // Assuming assignedTo and createdBy might be populated user objects with a 'name' field.
  assignedTo?: PopulatedUser | string | null;
  createdBy?: PopulatedUser | string | null;
  relatedActivities?: PopulatedActivity[] | string[] | null;

  // AI Suggestions should align with what backend sends but allow for partial data during form interactions.
  aiSuggestions?: Partial<BackendIDeal['aiSuggestions']> & {
    suggestedFields?: Partial<Record<keyof BackendIDeal, any>>;
    summary?: string;
    summaryKeywords?: string[];
  };

  // Frontend-only or virtuals that might not be on the initial BackendIDeal type
  stageColor?: string;
  progressPercentage?: number;
  isOverdue?: boolean;
  daysUntilClose?: number | null;
}


const DealDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [deal, setDeal] = useState<IDeal | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState<boolean>(false);
  const [summaryResult, setSummaryResult] = useState<SummarizationResult | null>(null);
  const [summaryLoading, setSummaryLoading] = useState<boolean>(false);

  const fetchDealDetails = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const response: ApiResponse<BackendIDeal> = await getDealById(id);
      if (response.success && response.data) {
        const backendData = response.data;
        
        // Helper to convert ObjectId to string or return as is if already string/object
        const processIdField = (field: any): any => {
          if (field && typeof field === 'object' && field.toString && !field.name && !(field instanceof Date)) {
            return field.toString();
          }
          return field; // already a string or a populated object
        };

        const frontendDeal: IDeal = {
          ...(backendData as Omit<BackendIDeal, 'expectedCloseDate' | 'actualCloseDate' | 'lastRecordingDate' | 'createdAt' | 'updatedAt' | 'assignedTo' | 'createdBy' | 'relatedActivities' | 'aiSuggestions'>),
          expectedCloseDate: backendData.expectedCloseDate ? new Date(backendData.expectedCloseDate).toLocaleDateString() : undefined,
          actualCloseDate: backendData.actualCloseDate ? new Date(backendData.actualCloseDate).toLocaleDateString() : undefined,
          lastRecordingDate: backendData.lastRecordingDate ? new Date(backendData.lastRecordingDate).toLocaleString() : undefined,
          createdAt: backendData.createdAt ? new Date(backendData.createdAt).toLocaleString() : undefined,
          updatedAt: backendData.updatedAt ? new Date(backendData.updatedAt).toLocaleString() : undefined,
          
          assignedTo: processIdField(backendData.assignedTo),
          createdBy: processIdField(backendData.createdBy),
          relatedActivities: Array.isArray(backendData.relatedActivities) ? backendData.relatedActivities.map(processIdField) : backendData.relatedActivities,
          
          stageColor: backendData.stageColor, 
          progressPercentage: backendData.progressPercentage,
          isOverdue: backendData.isOverdue,
          daysUntilClose: backendData.daysUntilClose,
          aiSuggestions: backendData.aiSuggestions ? 
            { 
              ...backendData.aiSuggestions, 
              suggestedFields: backendData.aiSuggestions.suggestedFields || {},
              summary: backendData.aiSuggestions.summary,
              summaryKeywords: backendData.aiSuggestions.summaryKeywords,
            } : 
            { suggestedFields: {}, summary: undefined, summaryKeywords: [] },
        };
        setDeal(frontendDeal);
        if (!frontendDeal.aiSuggestions?.summary && frontendDeal.lastRecordingTranscription) {
          fetchSummary(id);
        }
      } else {
        setError(response.error || 'Failed to fetch deal details.');
      }
    } catch (err: any) {
      setError('An unexpected error occurred: ' + err.message);
      console.error(err);
    }
    setLoading(false);
  }, [id]);

  const fetchSummary = async (dealId: string) => {
    if(!dealId) return;
    setSummaryLoading(true);
    try {
      const summaryResponse = await getDealSummary(dealId);
      if (summaryResponse.success && summaryResponse.data) {
        setSummaryResult(summaryResponse.data);
      } else {
        setError(prev => prev ? `${prev}\n${summaryResponse.error}` : summaryResponse.error || 'Failed to fetch summary.');
      }
    } catch (err: any) {
      setError(prev => prev ? `${prev}\nSummary fetch error: ${err.message}` : `Summary fetch error: ${err.message}`);
    } finally {
      setSummaryLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
        fetchDealDetails();
    }
  }, [id, fetchDealDetails]);

  const handleDelete = async () => {
    if (!id) return;
    if (window.confirm('Are you sure you want to delete this deal?')) {
      setLoading(true);
      try {
        const response = await deleteDeal(id);
        if (response.success) {
          alert('Deal deleted successfully!');
          navigate('/deals');
        } else {
          setError(response.error || 'Failed to delete deal.');
        }
      } catch (err: any) {
        setError('An unexpected error occurred while deleting: ' + err.message);
      } finally {
        setLoading(false);
      }
    }
  };
  
  const handleAutoFill = async () => {
    if (!id || !deal?.lastRecordingTranscription) {
      alert('No transcription available for auto-fill or deal not loaded.');
      return;
    }
    setAiLoading(true);
    setError(null);
    try {
      const response: ApiResponse<{deal: BackendIDeal, suggestions: any}> = await autoFillFromTranscription(id, deal.lastRecordingTranscription);
      if (response.success && response.data && response.data.deal) {
        alert('AI suggestions generated! Refreshing deal details...');
        fetchDealDetails(); 
      } else {
        setError(response.error || 'Failed to auto-fill from transcription.');
      }
    } catch (err: any) {
      setError('Error during AI auto-fill: ' + err.message);
    } finally {
      setAiLoading(false);
    }
  };
  
  const handleApplyAllSuggestionsAndEdit = async () => {
    if (!id || !deal?.aiSuggestions?.suggestedFields || Object.keys(deal.aiSuggestions.suggestedFields).length === 0) {
      alert('No new suggestions to apply or suggestions already handled.');
      return;
    }
    setLoading(true); 
    setError(null);
    try {
        const fieldsToApply = { ...deal.aiSuggestions.suggestedFields };
        Object.keys(fieldsToApply).forEach(key => {
            if (fieldsToApply[key] === undefined || fieldsToApply[key] === null) {
                delete fieldsToApply[key];
            }
        });
        if (Object.keys(fieldsToApply).length === 0) {
            alert("No new suggestions to apply.");
            setLoading(false);
            return;
        }

        const response = await approveAISuggestions(id, fieldsToApply as Record<string, any>); 
        if (response.success) {
            alert('AI suggestions have been applied. Navigating to edit form.');
            navigate(`/deals/edit/${id}`); 
        } else {
            setError(response.error || 'Failed to apply suggestions.');
        }
    } catch (err: any) {
        setError('Error applying AI suggestions: ' + err.message);
    } finally {
        setLoading(false);
    }
  };

  if (loading && !deal) return <div className="flex justify-center items-center h-screen"><div className="text-xl text-gray-700">Loading deal details...</div></div>;
  if (error && !deal) return <div className="container mx-auto p-4"><div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">Error: {error}</div></div>;
  if (!deal) return <div className="text-center p-8 text-xl text-gray-500">Deal not found.</div>;
  
  const hasPendingSuggestions = deal.aiSuggestions && 
                              deal.aiSuggestions.suggestedFields && 
                              Object.values(deal.aiSuggestions.suggestedFields).some(v => v !== undefined && v !== null) &&
                              !deal.aiSuggestions.approved;
  
  const assignedToUser = deal.assignedTo as PopulatedUser | null;
  const createdByUser = deal.createdBy as PopulatedUser | null;
  const displaySummary = summaryResult?.summary || deal.aiSuggestions?.summary;
  const displayKeywords = summaryResult?.keywords || deal.aiSuggestions?.summaryKeywords;

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 bg-gray-100 min-h-screen">
      <div className="bg-white shadow-2xl rounded-lg p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 pb-6 border-b border-gray-200">
          <div>
            <h1 className="text-4xl font-bold text-gray-800">{deal.dealName}</h1>
            <p className="text-gray-600 text-lg mt-1">{deal.companyName}</p>
          </div>
          <div className="mt-4 sm:mt-0 flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
            <Link 
              to={`/deals/edit/${id}`}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-5 rounded-lg shadow-md hover:shadow-lg transition duration-150 ease-in-out text-center"
            >
              Edit Deal
            </Link>
            <button 
              onClick={handleDelete} 
              disabled={loading}
              className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-5 rounded-lg shadow-md hover:shadow-lg transition duration-150 ease-in-out disabled:opacity-70"
            >
              {loading ? 'Deleting...' : 'Delete Deal'}
            </button>
          </div>
        </div>

        {(deal.lastRecordingTranscription || hasPendingSuggestions) && (
            <div className="mb-6 p-4 bg-indigo-50 border border-indigo-200 rounded-lg shadow">
                <h3 className="text-xl font-semibold text-indigo-700 mb-3">AI-Powered Actions</h3>
                <div className="flex flex-wrap gap-3 items-center">
                    {deal.lastRecordingTranscription && (
                        <button 
                            onClick={handleAutoFill} 
                            disabled={aiLoading || loading}
                            className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-lg text-sm shadow hover:shadow-md transition duration-150 disabled:opacity-70"
                        >
                            {aiLoading ? 'Analyzing Transcription...' : 'Analyze for Suggestions'}
                        </button>
                    )}
                    {hasPendingSuggestions && (
                        <button 
                            onClick={handleApplyAllSuggestionsAndEdit}
                            disabled={loading || aiLoading}
                            className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg text-sm shadow hover:shadow-md transition duration-150 disabled:opacity-70"
                        >
                            {loading ? 'Applying...' : 'Apply Suggestions & Edit'}
                        </button>
                    )}
                </div>
                 {deal.aiSuggestions?.approved && !hasPendingSuggestions && <p className="text-sm text-green-700 mt-2">All prior AI suggestions have been reviewed and applied.</p>}
                 {error && <div className="mt-3 bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded text-sm" role="alert">{error}</div>}
            </div>
        )}

        {(deal.lastRecordingTranscription || displaySummary) && (
          <div className="mb-8 p-4 bg-gray-50 rounded-lg shadow">
            <div className="flex justify-between items-center mb-2">
                <h3 className="text-xl font-semibold text-gray-800">Deal Summary</h3>
                {deal.lastRecordingTranscription && !displaySummary && (
                     <button 
                        onClick={() => id && fetchSummary(id)} 
                        disabled={summaryLoading}
                        className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-1 px-3 rounded-lg text-xs shadow hover:shadow-md transition duration-150 disabled:opacity-70"
                    >
                        {summaryLoading ? 'Generating...' : 'Generate Summary'}
                    </button>
                )}
            </div>
            {summaryLoading && <p className="text-sm text-gray-500 italic">Generating summary...</p>}
            {displaySummary && (
                <div className="bg-white p-3 rounded-md border border-gray-200">
                    <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">{displaySummary}</p>
                    {displayKeywords && displayKeywords.length > 0 && (
                        <div className="mt-3 pt-2 border-t border-gray-200">
                            <strong className="text-xs text-gray-500">Keywords:</strong>
                            <div className="flex flex-wrap gap-2 mt-1">
                                {displayKeywords.map((keyword, i) => (
                                    <span key={i} className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium shadow-sm">
                                        {keyword}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
            {!displaySummary && !summaryLoading && deal.lastRecordingTranscription && 
                <p className="text-sm text-gray-500 italic">No summary available yet. Click "Generate Summary" if there's a transcription.</p>}
             {!deal.lastRecordingTranscription && !displaySummary &&
                <p className="text-sm text-gray-500 italic">No transcription recorded for this deal to generate a summary.</p>}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-6 mb-8 text-sm text-gray-700">
          <div className="space-y-3 p-4 bg-gray-50 rounded-lg shadow">
            <h4 className="font-semibold text-gray-800 border-b pb-1 mb-2">Contact Info</h4>
            <div><strong className="text-gray-600">Person:</strong> {deal.contactPerson}</div>
            <div><strong className="text-gray-600">Email:</strong> {deal.contactEmail || 'N/A'}</div>
            <div><strong className="text-gray-600">Phone:</strong> {deal.contactPhone || 'N/A'}</div>
          </div>

          <div className="space-y-3 p-4 bg-gray-50 rounded-lg shadow">
            <h4 className="font-semibold text-gray-800 border-b pb-1 mb-2">Deal Status</h4>
            <div><strong className="text-gray-600">Stage:</strong> 
              <span className="ml-2 px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full uppercase tracking-wider" style={{ backgroundColor: deal.stageColor || '#A0AEC0', color: 'white' }}>
                {deal.dealStage}
              </span>
            </div>
            <div><strong className="text-gray-600">Probability:</strong> {deal.probability?.toFixed(0) || '0'}%</div>
            <div><strong className="text-gray-600">Value:</strong> {deal.dealValue?.toLocaleString() || '0'} {deal.currency}</div>
            <div><strong className="text-gray-600">Expected Close:</strong> {deal.expectedCloseDate || 'N/A'}</div>
            {deal.isOverdue && <div className="text-red-500 font-semibold">Overdue!</div>}
            {deal.daysUntilClose !== null && deal.daysUntilClose !== undefined && !deal.isOverdue && deal.dealStage !== 'closed-won' && deal.dealStage !== 'closed-lost' && 
                <div><strong className="text-gray-600">Days to Close:</strong> {deal.daysUntilClose}</div>}
          </div>
          
          <div className="space-y-3 p-4 bg-gray-50 rounded-lg shadow">
            <h4 className="font-semibold text-gray-800 border-b pb-1 mb-2">Metadata</h4>
            <div><strong className="text-gray-600">Source:</strong> {deal.source}</div>
            <div><strong className="text-gray-600">Assigned To:</strong> {assignedToUser?.name || 'Unassigned'}</div>
            <div><strong className="text-gray-600">Created By:</strong> {createdByUser?.name || 'N/A'}</div>
            <div><strong className="text-gray-600">Created At:</strong> {deal.createdAt}</div>
            <div><strong className="text-gray-600">Last Updated:</strong> {deal.updatedAt}</div>
            {deal.actualCloseDate && <div><strong className="text-gray-600">Actual Close:</strong> {deal.actualCloseDate}</div>}
          </div>
        </div>

        <div className="mb-8 p-4 bg-white rounded-lg shadow">
          <h3 className="text-xl font-semibold text-gray-800 mb-2">Description</h3>
          <p className="text-gray-600 whitespace-pre-wrap text-sm leading-relaxed">{deal.description || <span className="italic text-gray-400">No description provided.</span>}</p>
        </div>
        <div className="mb-8 p-4 bg-white rounded-lg shadow">
          <h3 className="text-xl font-semibold text-gray-800 mb-2">Notes</h3>
          <p className="text-gray-600 whitespace-pre-wrap text-sm leading-relaxed">{deal.notes || <span className="italic text-gray-400">No notes added.</span>}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div className="p-4 bg-white rounded-lg shadow">
            <h3 className="text-xl font-semibold text-gray-800 mb-3">Tags</h3>
            {deal.tags && deal.tags.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {deal.tags.map(tag => <span key={tag} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium shadow-sm">{tag}</span>)}
              </div>
            ) : <p className="text-gray-500 italic">No tags.</p>}
          </div>
          <div className="p-4 bg-white rounded-lg shadow">
            <h3 className="text-xl font-semibold text-gray-800 mb-3">Next Actions</h3>
            {deal.nextActions && deal.nextActions.length > 0 ? (
              <ul className="list-disc list-inside space-y-1 text-gray-600 text-sm">
                {deal.nextActions.map((action, i) => <li key={i}>{action}</li>)}
              </ul>
            ) : <p className="text-gray-500 italic">No next actions.</p>}
          </div>
        </div>

        <div className="mb-8 p-4 bg-white rounded-lg shadow">
            <h3 className="text-xl font-semibold text-gray-800 mb-3">Related Sales Activities</h3>
            {deal.relatedActivities && deal.relatedActivities.length > 0 ? (
                 <ul className="list-disc list-inside space-y-1 text-gray-600 text-sm">
                    {(deal.relatedActivities as PopulatedActivity[]).map((activity) => (
                        <li key={activity._id || JSON.stringify(activity)}>
                             <Link to={`/activities/${activity._id}`} className="text-indigo-600 hover:underline">
                                {activity.title || 'View Activity'}
                             </Link>
                        </li>
                    ))}
                </ul>
            ) : <p className="text-gray-500 italic">No related activities linked.</p>}
        </div>
        
        {deal.lastRecordingTranscription && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg shadow">
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Last Recording Transcription</h3>
                <p className="text-xs text-gray-500 mb-2">Recorded on: {deal.lastRecordingDate || 'N/A'}</p>
                <div className="p-4 bg-gray-100 rounded-md text-sm text-gray-700 whitespace-pre-wrap max-h-60 overflow-y-auto border border-gray-200">
                    {deal.lastRecordingTranscription}
                </div>
            </div>
        )}

      </div>
    </div>
  );
};

export default DealDetail; 