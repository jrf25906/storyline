import {
  Bold, Italic, Underline, Strikethrough,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered, Indent, Outdent,
  Undo, Redo, Link, Image, Table,
  Code, Quote, Heading1, Heading2, Heading3,
  Download, Upload, Mic, MicOff
} from 'lucide-react';
import { useState } from 'react';
import { useEditorStore } from '@stores/editorStore';
import { cn } from '@utils/cn';
import * as Tooltip from '@radix-ui/react-tooltip';

interface ToolbarProps {
  editorRef: React.MutableRefObject<any>;
}

export function Toolbar({ editorRef }: ToolbarProps) {
  const [isRecording, setIsRecording] = useState(false);
  const { wordCount, characterCount } = useEditorStore();

  const execCommand = (command: string, value?: string) => {
    if (editorRef.current) {
      editorRef.current.execCommand(command, false, value);
      editorRef.current.focus();
    }
  };

  const toggleRecording = () => {
    setIsRecording(!isRecording);
    // Voice recording logic would go here
  };

  const ToolbarButton = ({ 
    onClick, 
    icon: Icon, 
    tooltip, 
    active = false 
  }: { 
    onClick: () => void; 
    icon: any; 
    tooltip: string; 
    active?: boolean;
  }) => (
    <Tooltip.Provider>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <button
            onClick={onClick}
            className={cn(
              "p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors",
              active && "bg-gray-200 dark:bg-gray-700"
            )}
          >
            <Icon className="w-4 h-4" />
          </button>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content
            className="bg-gray-900 text-white px-2 py-1 rounded text-xs"
            sideOffset={5}
          >
            {tooltip}
            <Tooltip.Arrow className="fill-gray-900" />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );

  return (
    <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 sticky top-0 z-10">
      <div className="flex items-center justify-between px-4 py-2">
        <div className="flex items-center gap-1">
          {/* Text formatting */}
          <div className="flex items-center gap-1 mr-2">
            <ToolbarButton onClick={() => execCommand('Bold')} icon={Bold} tooltip="Bold (Ctrl+B)" />
            <ToolbarButton onClick={() => execCommand('Italic')} icon={Italic} tooltip="Italic (Ctrl+I)" />
            <ToolbarButton onClick={() => execCommand('Underline')} icon={Underline} tooltip="Underline (Ctrl+U)" />
            <ToolbarButton onClick={() => execCommand('Strikethrough')} icon={Strikethrough} tooltip="Strikethrough" />
          </div>

          <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />

          {/* Headings */}
          <div className="flex items-center gap-1 mr-2">
            <ToolbarButton onClick={() => execCommand('formatBlock', 'h1')} icon={Heading1} tooltip="Heading 1" />
            <ToolbarButton onClick={() => execCommand('formatBlock', 'h2')} icon={Heading2} tooltip="Heading 2" />
            <ToolbarButton onClick={() => execCommand('formatBlock', 'h3')} icon={Heading3} tooltip="Heading 3" />
          </div>

          <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />

          {/* Alignment */}
          <div className="flex items-center gap-1 mr-2">
            <ToolbarButton onClick={() => execCommand('JustifyLeft')} icon={AlignLeft} tooltip="Align Left" />
            <ToolbarButton onClick={() => execCommand('JustifyCenter')} icon={AlignCenter} tooltip="Align Center" />
            <ToolbarButton onClick={() => execCommand('JustifyRight')} icon={AlignRight} tooltip="Align Right" />
            <ToolbarButton onClick={() => execCommand('JustifyFull')} icon={AlignJustify} tooltip="Justify" />
          </div>

          <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />

          {/* Lists */}
          <div className="flex items-center gap-1 mr-2">
            <ToolbarButton onClick={() => execCommand('InsertUnorderedList')} icon={List} tooltip="Bullet List" />
            <ToolbarButton onClick={() => execCommand('InsertOrderedList')} icon={ListOrdered} tooltip="Numbered List" />
            <ToolbarButton onClick={() => execCommand('Indent')} icon={Indent} tooltip="Increase Indent" />
            <ToolbarButton onClick={() => execCommand('Outdent')} icon={Outdent} tooltip="Decrease Indent" />
          </div>

          <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />

          {/* Insert */}
          <div className="flex items-center gap-1 mr-2">
            <ToolbarButton onClick={() => execCommand('mceInsertLink')} icon={Link} tooltip="Insert Link" />
            <ToolbarButton onClick={() => execCommand('mceImage')} icon={Image} tooltip="Insert Image" />
            <ToolbarButton onClick={() => execCommand('mceInsertTable')} icon={Table} tooltip="Insert Table" />
            <ToolbarButton onClick={() => execCommand('mceCodeBlock')} icon={Code} tooltip="Code Block" />
            <ToolbarButton onClick={() => execCommand('mceBlockQuote')} icon={Quote} tooltip="Quote" />
          </div>

          <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />

          {/* Undo/Redo */}
          <div className="flex items-center gap-1">
            <ToolbarButton onClick={() => execCommand('Undo')} icon={Undo} tooltip="Undo (Ctrl+Z)" />
            <ToolbarButton onClick={() => execCommand('Redo')} icon={Redo} tooltip="Redo (Ctrl+Y)" />
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Voice recording */}
          <ToolbarButton 
            onClick={toggleRecording} 
            icon={isRecording ? MicOff : Mic} 
            tooltip={isRecording ? "Stop Recording" : "Start Voice Recording"}
            active={isRecording}
          />

          {/* Word count */}
          <div className="text-sm text-gray-500">
            {wordCount} words • {characterCount} characters
          </div>

          {/* Export */}
          <div className="flex items-center gap-1">
            <ToolbarButton onClick={() => {}} icon={Download} tooltip="Export Document" />
          </div>
        </div>
      </div>
    </div>
  );
}