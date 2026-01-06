import React, { useState } from 'react';
import { Search, FileText, Image, Table, Presentation, File, ExternalLink, FolderOpen, Eye, Plus, X, FileSpreadsheet, LayoutTemplate } from 'lucide-react';
import { GoogleCard, GoogleCardHeader, GoogleCardTitle, GoogleCardContent } from '../ui/GoogleCard';
import { GoogleButton } from '../ui/GoogleButton';
import { DriveIcon } from '../icons/GoogleIcons';
import { type DriveFile } from '@/lib/api';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

interface DocumentsViewProps {
  documents: DriveFile[];
  onSearch: (query: string) => Promise<void>;
  onClearSearch: () => void;
  isLoading: boolean;
  isSearchActive: boolean;
}

const fileTypeConfig: Record<string, { icon: React.ReactNode; color: string; bg: string }> = {
  document: { 
    icon: <FileText className="w-5 h-5" />, 
    color: 'text-google-blue', 
    bg: 'bg-google-blue/10' 
  },
  spreadsheet: { 
    icon: <Table className="w-5 h-5" />, 
    color: 'text-google-green', 
    bg: 'bg-google-green/10' 
  },
  presentation: { 
    icon: <Presentation className="w-5 h-5" />, 
    color: 'text-google-yellow', 
    bg: 'bg-google-yellow/10' 
  },
  pdf: { 
    icon: <FileText className="w-5 h-5" />, 
    color: 'text-google-red', 
    bg: 'bg-google-red/10' 
  },
  image: { 
    icon: <Image className="w-5 h-5" />, 
    color: 'text-purple-500', 
    bg: 'bg-purple-500/10' 
  },
  file: { 
    icon: <File className="w-5 h-5" />, 
    color: 'text-muted-foreground', 
    bg: 'bg-muted' 
  },
};

const templates = [
  { id: 'blank-doc', name: 'Blank Document', icon: FileText, color: 'text-google-blue', bg: 'bg-google-blue/10', type: 'document' },
  { id: 'blank-sheet', name: 'Blank Spreadsheet', icon: FileSpreadsheet, color: 'text-google-green', bg: 'bg-google-green/10', type: 'spreadsheet' },
  { id: 'blank-slides', name: 'Blank Presentation', icon: Presentation, color: 'text-google-yellow', bg: 'bg-google-yellow/10', type: 'presentation' },
  { id: 'meeting-notes', name: 'Meeting Notes', icon: FileText, color: 'text-google-blue', bg: 'bg-google-blue/10', type: 'document' },
  { id: 'project-plan', name: 'Project Plan', icon: FileSpreadsheet, color: 'text-google-green', bg: 'bg-google-green/10', type: 'spreadsheet' },
  { id: 'pitch-deck', name: 'Pitch Deck', icon: Presentation, color: 'text-google-yellow', bg: 'bg-google-yellow/10', type: 'presentation' },
];

export const DocumentsView: React.FC<DocumentsViewProps> = ({
  documents,
  onSearch,
  onClearSearch,
  isLoading,
  isSearchActive,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDoc, setSelectedDoc] = useState<DriveFile | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    await onSearch(searchQuery);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    onClearSearch();
  };

  const getFileConfig = (type: string) => {
    return fileTypeConfig[type] || fileTypeConfig.file;
  };

  const handleViewDocument = (doc: DriveFile) => {
    setSelectedDoc(doc);
  };

  const handleCreateFromTemplate = (template: typeof templates[0]) => {
    let url = '';
    switch (template.type) {
      case 'document':
        url = 'https://docs.google.com/document/create';
        break;
      case 'spreadsheet':
        url = 'https://docs.google.com/spreadsheets/create';
        break;
      case 'presentation':
        url = 'https://docs.google.com/presentation/create';
        break;
    }
    window.open(url, '_blank');
    setShowCreateModal(false);
  };

  return (
    <div className="space-y-6 animate-documents">
      {/* Search Section */}
      <GoogleCard className="animate-doc-item">
        <GoogleCardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-google-blue via-google-green to-google-yellow flex items-center justify-center">
              <DriveIcon className="w-5 h-5" />
            </div>
            <div>
              <GoogleCardTitle>My Documents</GoogleCardTitle>
              <p className="text-sm text-muted-foreground">View and search your Google Drive files</p>
            </div>
          </div>
          <GoogleButton 
            variant="blue" 
            size="sm" 
            className="gap-2"
            onClick={() => setShowCreateModal(true)}
          >
            <Plus className="w-4 h-4" />
            New Document
          </GoogleButton>
        </GoogleCardHeader>
        <GoogleCardContent>
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search documents, spreadsheets, presentations..."
                className="w-full h-12 pl-12 pr-4 bg-secondary rounded-full text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <GoogleButton 
              variant="blue" 
              onClick={handleSearch}
              disabled={isLoading}
            >
              {isLoading ? 'Searching...' : 'Search'}
            </GoogleButton>
          </div>
          
          {isSearchActive && (
            <div className="mt-4 flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                Showing filtered results
              </span>
              <GoogleButton 
                variant="outline" 
                size="sm"
                onClick={handleClearSearch}
                className="gap-2"
              >
                <X className="w-4 h-4" />
                Clear Search
              </GoogleButton>
            </div>
          )}
        </GoogleCardContent>
      </GoogleCard>

      {/* Documents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {documents.map((doc, idx) => {
          const config = getFileConfig(doc.type);
          return (
            <GoogleCard 
              key={idx} 
              hover 
              padding="sm"
              className="animate-doc-item"
              style={{ animationDelay: `${(idx + 1) * 50}ms` } as React.CSSProperties}
            >
              <div className="p-4">
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl ${config.bg} flex items-center justify-center flex-shrink-0`}>
                    <span className={config.color}>{config.icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">{doc.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(doc.modified).toLocaleDateString()} • {doc.size}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-4">
                  <GoogleButton 
                    variant="outline" 
                    size="sm" 
                    className="flex-1 gap-2"
                    onClick={() => handleViewDocument(doc)}
                  >
                    <Eye className="w-4 h-4" />
                    View
                  </GoogleButton>
                  <GoogleButton 
                    variant="ghost" 
                    size="sm"
                    className="gap-2"
                    onClick={() => window.open(doc.link, '_blank')}
                  >
                    <ExternalLink className="w-4 h-4" />
                  </GoogleButton>
                </div>
              </div>
            </GoogleCard>
          );
        })}
      </div>

      {documents.length === 0 && (
        <GoogleCard>
          <div className="text-center py-16">
            <div className="w-20 h-20 rounded-2xl bg-secondary flex items-center justify-center mx-auto mb-4">
              <FolderOpen className="w-10 h-10 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground font-medium">No documents found</p>
            <p className="text-sm text-muted-foreground/70 mt-1">Try searching for something specific</p>
          </div>
        </GoogleCard>
      )}

      {/* Document Preview Modal - View Only */}
      <Dialog open={!!selectedDoc} onOpenChange={() => setSelectedDoc(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              {selectedDoc && (
                <>
                  <div className={`w-8 h-8 rounded-lg ${getFileConfig(selectedDoc.type).bg} flex items-center justify-center`}>
                    <span className={getFileConfig(selectedDoc.type).color}>
                      {getFileConfig(selectedDoc.type).icon}
                    </span>
                  </div>
                  {selectedDoc.name}
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              Last modified: {selectedDoc && new Date(selectedDoc.modified).toLocaleDateString()}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex gap-3">
              <GoogleButton 
                variant="blue" 
                className="gap-2"
                onClick={() => selectedDoc && window.open(selectedDoc.link, '_blank')}
              >
                <ExternalLink className="w-4 h-4" />
                Open in Google Drive
              </GoogleButton>
            </div>

            <div className="p-4 rounded-xl bg-secondary/50 border border-border">
              <p className="text-sm text-muted-foreground">
                To create an AI summary of this document, go to the <strong>Summaries</strong> tab and click "New Chat" to upload a PDF.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Document Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-google-blue via-google-green to-google-yellow flex items-center justify-center">
                <LayoutTemplate className="w-5 h-5 text-primary-foreground" />
              </div>
              Create New Document
            </DialogTitle>
            <DialogDescription>
              Choose a template to get started
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">
            {templates.map((template) => (
              <button
                key={template.id}
                onClick={() => handleCreateFromTemplate(template)}
                className="p-4 rounded-xl border border-border bg-card hover:bg-secondary transition-colors text-left group"
              >
                <div className={`w-12 h-12 rounded-xl ${template.bg} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                  <template.icon className={`w-6 h-6 ${template.color}`} />
                </div>
                <p className="font-medium text-sm text-foreground">{template.name}</p>
              </button>
            ))}
          </div>

          <div className="flex justify-end gap-3 mt-4">
            <GoogleButton variant="outline" onClick={() => setShowCreateModal(false)}>
              Cancel
            </GoogleButton>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
