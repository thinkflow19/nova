'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';
import ProtectedRoute from '../../../components/auth/ProtectedRoute';
import BotDetailsForm from '../../../components/bot/BotDetailsForm';
import DocumentUpload from '../../../components/bot/DocumentUpload';
import BotPreview from '../../../components/bot/BotPreview';
// Import API when needed in production mode
import API from '../../../utils/api';

// Steps for the wizard
const STEPS = {
  DETAILS: 'details',
  UPLOAD: 'upload',
  PREVIEW: 'preview',
};

interface Document {
  id: string;
  name: string;
  size: number;
  type: string;
  status: string;
  progress?: number;
  error?: string;
}

interface BotData {
  name: string;
  brandColor: string;
  tone: string;
  documents: Document[];
}

export default function NewBotPage() {
  const router = useRouter();
  const { session } = useAuth();
  const [currentStep, setCurrentStep] = useState(STEPS.DETAILS);
  const [botData, setBotData] = useState<BotData>({
    name: '',
    brandColor: '#6366F1', // Default indigo color
    tone: 'friendly',
    documents: [],
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [projectId, setProjectId] = useState<string>('');

  const handleDetailsSubmit = async (details: { name: string; brandColor: string; tone: string }) => {
    setBotData((prev) => ({ ...prev, ...details }));
    
    try {
      // Create a new project in the backend
      setIsProcessing(true);
      
      if (!session?.access_token) {
        throw new Error('Authentication required');
      }
      
      // DEVELOPMENT MODE: Create a mock project without calling the API
      // In production, uncomment the API call below
      // const mockProjectId = `project-${Date.now()}`;
      // console.log('Created mock project with ID:', mockProjectId);
      // setProjectId(mockProjectId);
      
      // /*
      // API call to create project (for production)
      const response = await API.createProject({
        name: details.name, // Map form field to backend model field
        // description: null, // Optional: add if needed
        // is_public: false, // Optional: set default if needed
        // branding_color: details.brandColor, // Remove, not in backend model
        // tone: details.tone // Remove, not in backend model
      });
      
      // Store the project ID
      if (response && response.id) {
        setProjectId(response.id);
        console.log(`Project created successfully with ID: ${response.id}`);
      } else {
        throw new Error("Project creation response did not contain an ID.");
      }
      // */
      
      // Move to next step
      setCurrentStep(STEPS.UPLOAD);
    } catch (error) {
      console.error('Failed to create project:', error);
      alert('Failed to create project. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDocumentsSubmit = (documents: Document[]) => {
    setBotData((prev) => ({ ...prev, documents }));
    setCurrentStep(STEPS.PREVIEW);
  };

  const handleCreateBot = async () => {
    setIsProcessing(true);
    
    try {
      if (!session?.access_token || !projectId) {
        throw new Error('Authentication required or project not created');
      }
      
      // DEVELOPMENT MODE: Just log the update and redirect
      console.log('Updated project status to active:', projectId);
      
      /*
      // API call to update project (for production)
      await API.updateProject({
        id: projectId,
        status: 'active'
      }, session.access_token);
      */
      
      // Redirect to the dashboard after successful creation
      router.push('/dashboard');
    } catch (error) {
      console.error('Failed to create bot:', error);
      alert('Failed to launch bot. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBack = () => {
    if (currentStep === STEPS.UPLOAD) {
      setCurrentStep(STEPS.DETAILS);
    } else if (currentStep === STEPS.PREVIEW) {
      setCurrentStep(STEPS.UPLOAD);
    }
  };

  // Render the current step
  const renderStep = () => {
    switch (currentStep) {
      case STEPS.DETAILS:
        return <BotDetailsForm 
                 initialData={botData} 
                 onSubmit={handleDetailsSubmit} 
                 isProcessing={isProcessing}
               />;
      case STEPS.UPLOAD:
        return (
          <DocumentUpload 
            onSubmit={handleDocumentsSubmit} 
            onBack={handleBack}
            projectId={projectId}
          />
        );
      case STEPS.PREVIEW:
        return (
          <BotPreview 
            botData={botData} 
            onSubmit={handleCreateBot} 
            onBack={handleBack}
            isProcessing={isProcessing}
          />
        );
      default:
        return <BotDetailsForm 
                 initialData={botData} 
                 onSubmit={handleDetailsSubmit}
                 isProcessing={isProcessing}
               />;
    }
  };

  return (
    <ProtectedRoute>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Create a New AI Assistant</h1>
          <p className="mt-2 text-gray-600">
            Follow the steps below to set up your custom AI assistant
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <ol className="flex items-center">
            <li className={`flex items-center ${currentStep === STEPS.DETAILS ? 'text-blue-600' : 'text-gray-500'}`}>
              <span className={`flex items-center justify-center w-8 h-8 rounded-full ${
                currentStep === STEPS.DETAILS ? 'bg-blue-100 text-blue-600' : 
                currentStep === STEPS.UPLOAD || currentStep === STEPS.PREVIEW ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                1
              </span>
              <span className="ml-2 text-sm font-medium">Bot Details</span>
            </li>
            <li className="flex-1 h-px bg-gray-200 mx-2"></li>
            <li className={`flex items-center ${currentStep === STEPS.UPLOAD ? 'text-blue-600' : 'text-gray-500'}`}>
              <span className={`flex items-center justify-center w-8 h-8 rounded-full ${
                currentStep === STEPS.UPLOAD ? 'bg-blue-100 text-blue-600' : 
                currentStep === STEPS.PREVIEW ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                2
              </span>
              <span className="ml-2 text-sm font-medium">Upload Documents</span>
            </li>
            <li className="flex-1 h-px bg-gray-200 mx-2"></li>
            <li className={`flex items-center ${currentStep === STEPS.PREVIEW ? 'text-blue-600' : 'text-gray-500'}`}>
              <span className={`flex items-center justify-center w-8 h-8 rounded-full ${
                currentStep === STEPS.PREVIEW ? 'bg-blue-100 text-blue-600' : 'bg-gray-200 text-gray-600'
              }`}>
                3
              </span>
              <span className="ml-2 text-sm font-medium">Preview & Launch</span>
            </li>
          </ol>
        </div>

        {/* Current Step Content */}
        <div className="bg-white shadow-md rounded-lg p-6">
          {renderStep()}
        </div>
      </div>
    </ProtectedRoute>
  );
} 