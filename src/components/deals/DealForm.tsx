import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  IDeal as BackendIDeal, 
  DealStage, 
  CurrencyCode, 
  DealSource 
} from '../../../backend/src/models/Deal'; 
import { 
  createDeal, 
  getDealById, 
  updateDeal, 
  approveAISuggestions, 
  autoFillFromTranscription, 
  ApiResponse
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

// Frontend specific IDeal that makes all fields from BackendIDeal optional for form state
// and includes any frontend-only fields like stageColor.
export interface IDeal {
  _id?: string; 
  dealName?: string;
  companyName?: string;
  contactPerson?: string;
  contactEmail?: string;
  contactPhone?: string;
  dealValue?: number;
  currency?: CurrencyCode;
  dealStage?: DealStage;
  probability?: number;
  expectedCloseDate?: string; // Form will use string, convert to Date before sending to backend
  actualCloseDate?: string; // Form will use string
  source?: DealSource;
  description?: string;
  notes?: string;
  tags?: string[];
  nextActions?: string[];
  assignedTo?: PopulatedUser | string | null; 
  createdBy?: PopulatedUser | string | null; 
  relatedActivities?: PopulatedActivity[] | string[] | null;
  lastRecordingTranscription?: string;
  lastRecordingDate?: string; // Form will use string
  createdAt?: string; // Form will use string
  updatedAt?: string; // Form will use string

  aiSuggestions?: Partial<BackendIDeal['aiSuggestions']> & {
    suggestedFields?: Partial<Record<keyof BackendIDeal, any>>;
  };
  
  stageColor?: string; // Frontend only visual aid
  progressPercentage?: number;
  isOverdue?: boolean;
  daysUntilClose?: number | null;
}

const DealForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = Boolean(id);

  const initialDealState: IDeal = {
    dealName: '',
    companyName: '',
    contactPerson: '',
    contactEmail: '',
    contactPhone: '',
    dealValue: 0,
    currency: 'THB',
    dealStage: 'prospect',
    probability: 10,
    expectedCloseDate: undefined,
    source: 'other',
    description: '',
    notes: '',
    tags: [],
    nextActions: [],
    aiSuggestions: { suggestedFields: {} },
  };

  const [deal, setDeal] = useState<IDeal>(initialDealState);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState<boolean>(false);

  const fetchDealData = async (dealId: string) => {
    setLoading(true);
    try {
      const response: ApiResponse<BackendIDeal> = await getDealById(dealId);
      if (response.success && response.data) {
        const backendData = response.data;
        const frontendDeal: IDeal = {
          _id: backendData._id,
          dealName: backendData.dealName,
          companyName: backendData.companyName,
          contactPerson: backendData.contactPerson,
          contactEmail: backendData.contactEmail,
          contactPhone: backendData.contactPhone,
          dealValue: backendData.dealValue,
          currency: backendData.currency,
          dealStage: backendData.dealStage,
          probability: backendData.probability,
          source: backendData.source,
          description: backendData.description,
          notes: backendData.notes,
          tags: backendData.tags,
          nextActions: backendData.nextActions,
          lastRecordingTranscription: backendData.lastRecordingTranscription,
          expectedCloseDate: backendData.expectedCloseDate ? new Date(backendData.expectedCloseDate).toISOString().split('T')[0] : undefined,
          actualCloseDate: backendData.actualCloseDate ? new Date(backendData.actualCloseDate).toISOString().split('T')[0] : undefined,
          lastRecordingDate: backendData.lastRecordingDate ? new Date(backendData.lastRecordingDate).toLocaleString() : undefined,
          createdAt: backendData.createdAt ? new Date(backendData.createdAt).toLocaleString() : undefined,
          updatedAt: backendData.updatedAt ? new Date(backendData.updatedAt).toLocaleString() : undefined,
          assignedTo: backendData.assignedTo as any,
          createdBy: backendData.createdBy as any,
          relatedActivities: backendData.relatedActivities as any,
          aiSuggestions: backendData.aiSuggestions ? 
            { ...backendData.aiSuggestions, suggestedFields: backendData.aiSuggestions.suggestedFields || {} } : 
            { suggestedFields: {} },
          stageColor: backendData.stageColor,
          progressPercentage: backendData.progressPercentage,
          isOverdue: backendData.isOverdue,
          daysUntilClose: backendData.daysUntilClose,
        };
        setDeal(frontendDeal);
      } else {
        setError(response.error || 'Failed to fetch deal details.');
      }
    } catch (err: any) {
      setError('An unexpected error occurred: ' + err.message);
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (isEditMode && id) {
      fetchDealData(id);
    }
  }, [id, isEditMode]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setDeal(prev => ({
      ...prev,
      [name]: name === 'dealValue' || name === 'probability' ? parseFloat(value) : value
    } as IDeal));
  };

  const handleTagChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDeal(prev => ({ ...prev, tags: e.target.value.split(',').map(tag => tag.trim()) } as IDeal));
  }; 
  
  const handleNextActionChange = (index: number, value: string) => {
    const newNextActions = [...(deal.nextActions || [])];
    newNextActions[index] = value;
    setDeal(prev => ({ ...prev, nextActions: newNextActions } as IDeal));
  };

  const addNextAction = () => {
    setDeal(prev => ({ ...prev, nextActions: [...(prev.nextActions || []), ''] } as IDeal));
  };

  const removeNextAction = (index: number) => {
    setDeal(prev => ({ ...prev, nextActions: (deal.nextActions || []).filter((_, i) => i !== index) } as IDeal));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Prepare the data for submission, ensuring compatibility with BackendIDeal
    const dealToSubmit: Partial<BackendIDeal> = {
      _id: deal._id, // Include _id if it exists (for updates)
      dealName: deal.dealName || '',
      companyName: deal.companyName || '',
      contactPerson: deal.contactPerson || '',
      contactEmail: deal.contactEmail,
      contactPhone: deal.contactPhone,
      dealValue: Number(deal.dealValue) || 0,
      currency: deal.currency || 'THB',
      dealStage: deal.dealStage || 'prospect',
      probability: Number(deal.probability) || 0,
      source: deal.source || 'other',
      description: deal.description,
      notes: deal.notes,
      tags: deal.tags || [],
      nextActions: deal.nextActions || [],
      lastRecordingTranscription: deal.lastRecordingTranscription,
      expectedCloseDate: deal.expectedCloseDate ? new Date(deal.expectedCloseDate) : undefined,
      // Convert assignedTo and createdBy to string IDs if they are objects, or pass as is if already string/undefined
      assignedTo: (deal.assignedTo && typeof deal.assignedTo === 'object' && '_id' in deal.assignedTo) 
                    ? (deal.assignedTo as PopulatedUser)._id 
                    : deal.assignedTo as string | undefined,
      createdBy: (deal.createdBy && typeof deal.createdBy === 'object' && '_id' in deal.createdBy) 
                    ? (deal.createdBy as PopulatedUser)._id 
                    : deal.createdBy as string | undefined,
      // relatedActivities should also be an array of string IDs if populated from objects
      relatedActivities: Array.isArray(deal.relatedActivities) 
        ? deal.relatedActivities.map(activity => 
            (typeof activity === 'object' && activity !== null && '_id' in activity) ? (activity as PopulatedActivity)._id : activity as string
          ) 
        : undefined,
    };
    
    // For new deals, ensure createdBy is set (mock or from auth context later)
    if (!isEditMode && !dealToSubmit.createdBy) {
        dealToSubmit.createdBy = '507f1f77bcf86cd799439011' as any; // Mock user ID
    }

    try {
      const response = await (isEditMode && id ? updateDeal(id, dealToSubmit) : createDeal(dealToSubmit));
      if (response.success && response.data) {
        alert(`Deal ${isEditMode ? 'updated' : 'created'} successfully!`);
        navigate(isEditMode ? `/deals/${response.data._id}` : '/deals'); 
      } else {
        setError(response.error || `Failed to ${isEditMode ? 'update' : 'create'} deal.`);
        if (response.details) {
          console.error('Validation errors:', response.details);
          setError(prevError => `${prevError} Details: ${JSON.stringify(response.details)}`);
        }
      }
    } catch (err: any) {
      setError('An unexpected error occurred: ' + (err.message || 'Unknown error'));
      console.error(err);
    }
    setLoading(false);
  };

  const handleAutoFill = async () => {
    if (!id || !deal?.lastRecordingTranscription) {
      alert('No transcription available for auto-fill or deal not saved yet.');
      return;
    }
    setAiLoading(true);
    setError(null);
    try {
      const response: ApiResponse<{deal: BackendIDeal, suggestions: any}> = await autoFillFromTranscription(id, deal.lastRecordingTranscription);
      
      if (response.success && response.data && response.data.deal) {
        const backendDealData = response.data.deal;
        // Ensure aiSuggestions and suggestedFields exist and are not null
        if (backendDealData.aiSuggestions && typeof backendDealData.aiSuggestions === 'object' && backendDealData.aiSuggestions.suggestedFields && typeof backendDealData.aiSuggestions.suggestedFields === 'object') {
            const currentDeal = deal ? {...deal} : {...initialDealState};
            setDeal(prev => ({
              ...currentDeal,
              aiSuggestions: {
                ...(currentDeal.aiSuggestions || { suggestedFields: {}, confidence: 0, extractedAt: new Date(), approved: false }), // Provide default for currentDeal.aiSuggestions
                ...backendDealData.aiSuggestions, // This will overwrite confidence, extractedAt, approved from backend
                suggestedFields: {
                  ...(currentDeal.aiSuggestions?.suggestedFields || {}),
                  ...(backendDealData.aiSuggestions?.suggestedFields || {}), // Merge suggested fields
                }
              }
            } as IDeal));
            alert('AI suggestions generated! Please review and approve.');
        } else {
            setError('Transcription processed, but no specific AI suggestions were generated or suggestions format is unexpected.');
        }
      } else {
        setError(response.error || 'Failed to auto-fill from transcription or no deal data returned.');
      }
    } catch (err: any) {
      setError('Error during AI auto-fill: ' + err.message);
    } finally {
      setAiLoading(false);
    }
  };

  const handleApproveSuggestion = (fieldName: string, value: any) => {
    setDeal(prev => ({
      ...prev,
      [fieldName]: value,
      aiSuggestions: {
        ...(prev?.aiSuggestions as BackendIDeal['aiSuggestions']),
        suggestedFields: {
          ...(prev?.aiSuggestions?.suggestedFields as any),
          [fieldName]: undefined 
        }
      }
    } as IDeal));
  };
  
  const handleApproveAllAISuggestions = async () => {
    if (!id || !deal?.aiSuggestions?.suggestedFields) return;
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
        alert("No suggestions to apply or all suggestions are already applied.");
        setLoading(false);
        return;
      }

      const currentDealState = { ...deal }; // Preserve current state for potential revert

      // Optimistic UI update
      setDeal(prev => {
        const newDealState = { ...prev, ...fieldsToApply } as IDeal;
        if (newDealState.aiSuggestions) {
            newDealState.aiSuggestions.approved = true;
            newDealState.aiSuggestions.suggestedFields = {};
        }
        return newDealState;
      });

      const response = await approveAISuggestions(id, fieldsToApply as Record<string, any>); 
      if (response.success && response.data) {
          alert('AI suggestions applied and saved!');
          // Update form with the fully confirmed data from backend
          if (id) fetchDealData(id); // Re-fetch to get the absolute latest state
      } else {
        setError(response.error || 'Failed to save approved suggestions.');
        // Revert optimistic update on failure by restoring the preserved state and re-adding non-approved suggestions
        setDeal(prev => ({
            ...currentDealState,
            aiSuggestions: {
                ...(currentDealState.aiSuggestions || {}),
                approved: false, // Reset approved status
                suggestedFields: fieldsToApply // Put back the suggestions that failed to apply
            }
        } as IDeal)); 
      }

    } catch(err: any) {
      setError('Error approving AI suggestions: ' + err.message);
      if(id) fetchDealData(id); // Revert on error
    } finally {
      setLoading(false);
    }
  }

  if (loading && !deal?.dealName && isEditMode) return <div className="text-center p-8">Loading deal data...</div>;
  
  const renderAISuggestion = (fieldName: keyof IDeal) => {
    const suggestedFields = deal.aiSuggestions?.suggestedFields ?? {};
    const suggestion = suggestedFields[fieldName as string];
    const currentValue = deal[fieldName as keyof IDeal];
    
    if (suggestion === undefined || suggestion === null || String(suggestion) === String(currentValue)) {
      return null;
    }
    return (
      <div className="ml-2 mt-1 p-1 bg-yellow-100 border border-yellow-300 rounded text-xs flex items-center justify-between">
        <span>AI Suggests: <span className="font-semibold">{String(suggestion)}</span></span>
        <button 
          type="button" 
          onClick={() => handleApproveSuggestion(fieldName as string, suggestion)}
          className="ml-2 px-1 py-0.5 bg-green-500 text-white rounded hover:bg-green-600 text-xs"
        >
          Apply
        </button>
      </div>
    );
  };
  
  const currentSuggestedFields = deal.aiSuggestions?.suggestedFields || {};
  const hasVisibleSuggestions = Object.values(currentSuggestedFields).some(value => value !== undefined && value !== null);

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">
        {isEditMode ? `Edit Deal: ${deal?.dealName || ''}` : 'Create New Deal'}
      </h1>
      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">{error}</div>}
      
      <form onSubmit={handleSubmit} className="bg-white p-6 sm:p-8 rounded-lg shadow-xl space-y-6 max-w-3xl mx-auto">
        
        <section>
          <h2 className="text-xl font-semibold text-gray-700 mb-4 border-b pb-2">Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="dealName" className="block text-sm font-medium text-gray-700">Deal Name*</label>
              <input type="text" name="dealName" id="dealName" value={deal?.dealName || ''} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
              {renderAISuggestion('dealName')}
            </div>
            <div>
              <label htmlFor="companyName" className="block text-sm font-medium text-gray-700">Company Name*</label>
              <input type="text" name="companyName" id="companyName" value={deal?.companyName || ''} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
              {renderAISuggestion('companyName')}
            </div>
            <div>
              <label htmlFor="contactPerson" className="block text-sm font-medium text-gray-700">Contact Person*</label>
              <input type="text" name="contactPerson" id="contactPerson" value={deal?.contactPerson || ''} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
              {renderAISuggestion('contactPerson')}
            </div>
            <div>
              <label htmlFor="contactEmail" className="block text-sm font-medium text-gray-700">Contact Email</label>
              <input type="email" name="contactEmail" id="contactEmail" value={deal?.contactEmail || ''} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
              {renderAISuggestion('contactEmail')}
            </div>
            <div>
              <label htmlFor="contactPhone" className="block text-sm font-medium text-gray-700">Contact Phone</label>
              <input type="tel" name="contactPhone" id="contactPhone" value={deal?.contactPhone || ''} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
              {renderAISuggestion('contactPhone')}
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-700 mb-4 border-b pb-2">Deal Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="dealValue" className="block text-sm font-medium text-gray-700">Deal Value*</label>
              <input type="number" name="dealValue" id="dealValue" value={deal?.dealValue === undefined ? '' : deal.dealValue} onChange={handleChange} required min="0" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
              {renderAISuggestion('dealValue')}
            </div>
            <div>
              <label htmlFor="currency" className="block text-sm font-medium text-gray-700">Currency</label>
              <select name="currency" id="currency" value={deal?.currency || 'THB'} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm">
                {['THB', 'USD', 'EUR', 'GBP', 'JPY', 'SGD'].map(c => <option key={c} value={c as CurrencyCode}>{c}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="dealStage" className="block text-sm font-medium text-gray-700">Deal Stage</label>
              <select name="dealStage" id="dealStage" value={deal?.dealStage || 'prospect'} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm">
                {['prospect', 'qualified', 'proposal', 'negotiation', 'closed-won', 'closed-lost'].map(s => <option key={s} value={s as DealStage}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
              </select>
              {renderAISuggestion('dealStage')}
            </div>
            <div>
              <label htmlFor="probability" className="block text-sm font-medium text-gray-700">Probability (%)</label>
              <input type="number" name="probability" id="probability" value={deal?.probability === undefined ? '' : deal.probability} onChange={handleChange} min="0" max="100" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
              {renderAISuggestion('probability')}
            </div>
            <div>
              <label htmlFor="expectedCloseDate" className="block text-sm font-medium text-gray-700">Expected Close Date</label>
              <input type="date" name="expectedCloseDate" id="expectedCloseDate" value={deal?.expectedCloseDate || ''} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
            </div>
            <div>
              <label htmlFor="source" className="block text-sm font-medium text-gray-700">Source</label>
              <select name="source" id="source" value={deal?.source || 'other'} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm">
                {['cold-call', 'referral', 'website', 'social-media', 'email', 'other'].map(s => <option key={s} value={s as DealSource}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
              </select>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-700 mb-4 border-b pb-2">Additional Information</h2>
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
            <textarea name="description" id="description" value={deal?.description || ''} onChange={handleChange} rows={4} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
          </div>
          <div className="mt-4">
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700">Notes</label>
            <textarea name="notes" id="notes" value={deal?.notes || ''} onChange={handleChange} rows={4} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
          </div>
          <div className="mt-4">
            <label htmlFor="tags" className="block text-sm font-medium text-gray-700">Tags (comma-separated)</label>
            <input type="text" name="tags" id="tags" value={(deal?.tags || []).join(', ')} onChange={handleTagChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-700 mb-4 border-b pb-2">Next Actions</h2>
          {(deal?.nextActions || []).map((action, index) => (
            <div key={index} className="flex items-center space-x-2 mb-2">
              <input 
                type="text" 
                value={action} 
                onChange={(e) => handleNextActionChange(index, e.target.value)} 
                placeholder={`Action ${index + 1}`}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
              <button type="button" onClick={() => removeNextAction(index)} className="text-red-500 hover:text-red-700 p-1 rounded-full">&times;</button>
            </div>
          ))}
          <button type="button" onClick={addNextAction} className="mt-2 text-sm text-indigo-600 hover:text-indigo-800 font-medium">+ Add Next Action</button>
        </section>
        
        {isEditMode && deal?.aiSuggestions && hasVisibleSuggestions && !deal.aiSuggestions.approved && (
          <section className="p-4 border-2 border-dashed border-yellow-400 rounded-lg bg-yellow-50">
            <h2 className="text-xl font-semibold text-yellow-700 mb-3">AI Suggestions (Review & Apply)</h2>
            {deal.aiSuggestions.confidence !== undefined && <p className="text-sm text-gray-600 mb-1">Confidence: {deal.aiSuggestions.confidence.toFixed(2)}</p>}
            {deal.aiSuggestions.extractedAt && <p className="text-sm text-gray-600 mb-3">Extracted At: {new Date(deal.aiSuggestions.extractedAt).toLocaleString()}</p>}
            
            {isEditMode && deal.lastRecordingTranscription && (
                <button 
                    type="button" 
                    onClick={handleAutoFill} 
                    disabled={aiLoading}
                    className="mb-4 w-full bg-purple-500 hover:bg-purple-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition duration-150 ease-in-out disabled:opacity-50"
                >
                    {aiLoading ? 'Processing Transcription...' : 'Re-Scan Transcription for Suggestions'}
                </button>
            )}

            <div className="space-y-2">
              {Object.entries(currentSuggestedFields).map(([key, value]) => {
                if (value === undefined || value === null) return null;
                if (String(value) === String((deal as any)[key])) return null; 

                return (
                  <div key={key} className="p-3 bg-white border border-gray-200 rounded-md shadow-sm">
                    <p className="text-sm text-gray-700">
                      Field: <strong className="capitalize">{key.replace(/([A-Z])/g, ' $1')}</strong>
                    </p>
                    <p className="text-sm text-gray-500">Current: {String((deal as any)[key] === undefined || (deal as any)[key] === null ? 'Not set' : (deal as any)[key])}</p>
                    <p className="text-sm text-green-700 font-semibold">Suggested: {String(value)}</p>
                    <button 
                      type="button" 
                      onClick={() => handleApproveSuggestion(key as keyof IDeal, value)}
                      className="mt-1 px-3 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600 transition duration-150"
                    >
                      Apply Suggestion
                    </button>
                  </div>
                );
              })}
            </div>
            {hasVisibleSuggestions && (
                 <button 
                    type="button" 
                    onClick={handleApproveAllAISuggestions} 
                    disabled={loading}
                    className="mt-4 w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition duration-150 ease-in-out disabled:opacity-50"
                >
                    {loading ? 'Saving...' : 'Apply All Visible Suggestions & Save Deal'}
                </button>
            )}
          </section>
        )}

        {isEditMode && deal?.lastRecordingTranscription && (!deal.aiSuggestions || deal.aiSuggestions.approved || !hasVisibleSuggestions) && (
             <section className="mt-6">
                <button 
                    type="button" 
                    onClick={handleAutoFill} 
                    disabled={aiLoading}
                    className="w-full bg-purple-500 hover:bg-purple-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition duration-150 ease-in-out disabled:opacity-50"
                >
                    {aiLoading ? 'Processing Transcription...' : (deal.aiSuggestions?.approved ? 'Re-Scan Transcription for New Suggestions' : 'Scan Last Transcription for Suggestions' )}
                </button>
                {deal.lastRecordingTranscription && <p className="text-xs text-gray-500 mt-1">Last recording on: {deal.lastRecordingDate || 'N/A'}</p>}
            </section>
        )}

        <div className="flex items-center justify-end space-x-4 pt-5 border-t mt-8">
          <button 
            type="button" 
            onClick={() => navigate(-1)} 
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded-lg transition duration-150 ease-in-out"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            disabled={loading || aiLoading}
            className="bg-primary-500 hover:bg-primary-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition duration-150 ease-in-out disabled:opacity-50"
          >
            {loading ? 'Saving...' : (isEditMode ? 'Update Deal' : 'Create Deal')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default DealForm; 