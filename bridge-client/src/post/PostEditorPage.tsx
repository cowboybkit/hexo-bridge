import React, { useLayoutEffect, useRef, useState } from "react";
import Navigation from "../shared/components/Navigation";
import { Prompt, useParams } from "react-router-dom";
import useAPI from "../shared/useAPI";
import { Button, ButtonGroup, ControlGroup, Divider, InputGroup, Intent, Popover, Spinner } from "@blueprintjs/core";
import PostEditorActionDropdown from "./PostEditorActionDropdown";
import { Notification } from "../shared/helpers/notification";
import { DatePicker } from "@blueprintjs/datetime";
import FrontMatterEditor from "../shared/components/FrontMatterEditor";
import { parsePostData, validateRequiredPostMetadataFields } from "../shared/helpers/frontMatterParserHelper";
import AceEditor from "react-ace";
import "ace-builds/src-noconflict/theme-xcode";
import "ace-builds/src-noconflict/mode-markdown";
import "ace-builds/src-min-noconflict/ext-searchbox";
import GenericError from "../shared/components/GenericError";
import { AxiosRequestConfig } from "axios";
import { RouteParams } from "../shared/types/router";

import '@toast-ui/editor/dist/toastui-editor.css';

import { Editor } from '@toast-ui/react-editor';


const frontMatterHelper = require("hexo-front-matter");
//API Config
const getSinglePostAPI: AxiosRequestConfig = {
  method: "POST",
  url: "posts/getSingle",
};

const savePostAPI: AxiosRequestConfig = {
  method: "POST",
  url: "posts/save",
};

const getUserPrefsAPI: AxiosRequestConfig = {
  method: "GET",
  url: "settings/bridge/getAsJson",
};

export default function PostEditorPage() {
  const { id } = useParams<RouteParams>();
  const { data: userPrefs } = useAPI(getUserPrefsAPI);
  //Get post from api, setup code editor, preview & parse front matter for metadata.
  const {
    loading: isLoading,
    error,
    data: postData,
  } = useAPI({
    ...getSinglePostAPI,
    data: {
      id: id,
    },
  });
  const editorRef = React.createRef<Editor>();
  
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [metadata, setMetadata] = useState({ title: "", categories: [], tags: [], date: new Date().toISOString() });
  const [content, setContent] = useState("");
  const [showFrontMatterEditor, setShowFrontMatterEditor] = useState(false);
  const { execute: savePost } = useAPI(
    {
      ...savePostAPI,
      data: {
        id: id,
        content: frontMatterHelper.stringify(metadata) + content,
      },
    },
    true
  );
  function onChangeEditor() {
    const newEditor = editorRef.current as Editor;
    if(!newEditor) return;
    const newContent = newEditor.getInstance().getMarkdown();
    if (newContent === content) {
       // skip when the same
       console.info('same...');
       return;
    }

    // console.info('onChange content', content,event);
    setContent(newContent);
    setHasUnsavedChanges(true);
 };
  //Parse post from api
  useLayoutEffect(() => {
    if (postData.raw) {
      const parsedPost = parsePostData(postData);
      setContent(parsedPost.content);
      setMetadata(parsedPost.meta);
    }
  }, [postData]);

  async function onSave() {
    try {
      await savePost();
      setHasUnsavedChanges(false);
      Notification.show({
        message: "Saved!",
        intent: Intent.SUCCESS,
        icon: "saved",
      });
    } catch (error) {
      console.error("Unable to save post.", error);
      Notification.show({
        message: "Oh no, I can't save the post. 😟 ",
        intent: Intent.DANGER,
        icon: "delete",
      });
    }
  }

  function getState() {
    if (isLoading) {
      return <Spinner />;
    }
    if (error) {
      return <GenericError />;
    }
    return (
      <>
        <ControlGroup className="margin">
          <InputGroup
            leftIcon="edit"
            placeholder="I ❤️ hexo."
            value={metadata.title}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
              setMetadata({ ...metadata, title: event.target.value });
              setHasUnsavedChanges(true);
            }}
          />
          <Divider />
          <ButtonGroup minimal>
            <Button
              icon="property"
              onClick={() => {
                setShowFrontMatterEditor(true);
              }}
            >
              Categories ({metadata.categories.length})
            </Button>
            <Button
              icon="tag"
              onClick={() => {
                setShowFrontMatterEditor(true);
              }}
            >
              Tags ({metadata.tags.length})
            </Button>
            <Popover autoFocus={false}>
              <Button icon="calendar">
                {new Date(metadata.date).toLocaleString(undefined, {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </Button>
              <DatePicker
                value={new Date(metadata.date)}
                onChange={(selectedDate: Date, isUserChange: boolean) => {
                  if (isUserChange) {
                    setMetadata({ ...metadata, date: selectedDate.toISOString() });
                    setHasUnsavedChanges(true);
                  }
                }}
              />
            </Popover>
            <Divider />
            <Button
              icon="annotation"
              text={"Front matter"}
              minimal
              onClick={() => {
                setShowFrontMatterEditor(true);
              }}
            />
            <FrontMatterEditor
              isOpen={showFrontMatterEditor}
              value={frontMatterHelper.stringify(metadata)}
              onClose={(newData) => {
                setShowFrontMatterEditor(false);
                setMetadata(validateRequiredPostMetadataFields(newData));
                setHasUnsavedChanges(true);
              }}
            />
          </ButtonGroup>
          <span style={{ flexGrow: 1 }} />
          <ButtonGroup minimal>
            <Button icon="floppy-disk" text="Save" onClick={onSave} disabled={!hasUnsavedChanges} />
            <PostEditorActionDropdown savePost={onSave} />
          </ButtonGroup>
        </ControlGroup>
        <div className="code-editor-preview-container">
          {/* <AceEditor
            height="90vh"
            width="100vw"
            mode="markdown"
            theme="xcode"
            wrapEnabled={true}
            value={content}
            onLoad={(editor) => {
              editor.getSession().setValue(content);
            }}
            onChange={(newContent: string) => {
              setContent(newContent);
              setHasUnsavedChanges(true);
            }}
            setOptions={{ useWorker: false }}
            commands={[
              {
                // commands is array of key bindings.
                name: "SavePost",
                bindKey: { win: "Ctrl-S", mac: "Ctrl-S" },
                exec: () => {}, //Disable default browser behavior
              },
            ]}
            fontSize={userPrefs.editorFontSize || 14}
            showPrintMargin={false}
            editorProps={{ $blockScrolling: true }}
          /> */}
           <Editor
            onKeyup={onChangeEditor}
            onCaretChange={onChangeEditor}
            initialValue={content}
            previewStyle="vertical"
            height="90vh"
            initialEditType="wysiwyg"
            useCommandShortcut={true}
            ref={editorRef}
          />
        </div>
        <Prompt when={hasUnsavedChanges} message="You have unsaved changes, are you sure you want to leave?" />
      </>
    );
  }

  return (
    <>
      <Navigation />
      {getState()}
    </>
  );
}
