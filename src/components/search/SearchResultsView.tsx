import React from "react";
import { FileText, Mail, SearchX } from "lucide-react";
import type { DriveFile, Email } from "@/lib/api";
import { GoogleCard, GoogleCardHeader, GoogleCardTitle, GoogleCardContent } from "@/components/ui/GoogleCard";
import { GoogleButton } from "@/components/ui/GoogleButton";

interface SearchResultsViewProps {
  query: string;
  emails: Email[];
  documents: DriveFile[];
  onClear: () => void;
  onOpenEmail: (email: Email) => void;
  onOpenDocument: (doc: DriveFile) => void;
}

export const SearchResultsView: React.FC<SearchResultsViewProps> = ({
  query,
  emails,
  documents,
  onClear,
  onOpenEmail,
  onOpenDocument,
}) => {
  const total = emails.length + documents.length;

  return (
    <section className="space-y-6 animate-fade-in">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Search results</h2>
          <p className="text-sm text-muted-foreground">
            Showing {total} result{total === 1 ? "" : "s"} for <span className="font-medium text-foreground">“{query}”</span>
          </p>
        </div>
        <GoogleButton variant="outline" className="gap-2" onClick={onClear}>
          <SearchX className="w-4 h-4" />
          Clear search
        </GoogleButton>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GoogleCard>
          <GoogleCardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-google-blue/10 flex items-center justify-center">
                <Mail className="w-5 h-5 text-google-blue" />
              </div>
              <GoogleCardTitle>Emails</GoogleCardTitle>
            </div>
          </GoogleCardHeader>
          <GoogleCardContent>
            {emails.length === 0 ? (
              <p className="text-sm text-muted-foreground">No matching emails.</p>
            ) : (
              <div className="space-y-2">
                {emails.slice(0, 20).map((e) => (
                  <button
                    key={e.id}
                    onClick={() => onOpenEmail(e)}
                    className="w-full text-left p-4 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors"
                  >
                    <p className="text-sm font-medium text-foreground truncate">{e.subject}</p>
                    <p className="text-xs text-muted-foreground mt-1 truncate">{e.from}</p>
                    <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{e.snippet}</p>
                  </button>
                ))}
              </div>
            )}
          </GoogleCardContent>
        </GoogleCard>

        <GoogleCard>
          <GoogleCardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-google-green/10 flex items-center justify-center">
                <FileText className="w-5 h-5 text-google-green" />
              </div>
              <GoogleCardTitle>Documents</GoogleCardTitle>
            </div>
          </GoogleCardHeader>
          <GoogleCardContent>
            {documents.length === 0 ? (
              <p className="text-sm text-muted-foreground">No matching documents.</p>
            ) : (
              <div className="space-y-2">
                {documents.slice(0, 20).map((d) => (
                  <button
                    key={d.id}
                    onClick={() => onOpenDocument(d)}
                    className="w-full text-left p-4 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors"
                  >
                    <p className="text-sm font-medium text-foreground truncate">{d.name}</p>
                    <p className="text-xs text-muted-foreground mt-1 truncate">{new Date(d.modified).toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground mt-2 truncate">{d.type}</p>
                  </button>
                ))}
              </div>
            )}
          </GoogleCardContent>
        </GoogleCard>
      </div>
    </section>
  );
};
