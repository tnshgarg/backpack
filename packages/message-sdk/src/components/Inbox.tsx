import { useEffect, useState } from "react";
import type { EnrichedInboxDb } from "@coral-xyz/common";
import { BACKEND_API_URL } from "@coral-xyz/common";
import { TextInput } from "@coral-xyz/react-common";
import { useUser } from "@coral-xyz/recoil";

import { ParentCommunicationManager } from "../ParentCommunicationManager";

import { MessageList } from "./MessageList";
import { MessagesSkeleton } from "./MessagesSkeleton";
import { useStyles } from "./styles";
import { UserList } from "./UserList";

export function Inbox() {
  const classes = useStyles();
  const { uuid } = useUser();
  const [searchFilter, setSearchFilter] = useState("");
  const [messagesLoading, setMessagesLoading] = useState(true);
  const [activeChats, setActiveChats] = useState<EnrichedInboxDb[]>([]);
  const [requestCount, setRequestCount] = useState(0);
  const [searchResults, setSearchResults] = useState<
    { image: string; id: string; username: string }[]
  >([]);

  const init = async () => {
    const res = await ParentCommunicationManager.getInstance().fetch(
      `${BACKEND_API_URL}/inbox?areConnected=true`
    );
    const json = await res.json();
    setMessagesLoading(false);
    setActiveChats(json.chats || []);
    setRequestCount(json.requestCount || 0);
  };

  useEffect(() => {
    init();
  }, [uuid]);

  const searchedUsersDistinct = searchResults.filter(
    (result) =>
      !activeChats.map((x) => x.remoteUsername).includes(result.username)
  );

  return (
    <div className={classes.container}>
      <div style={{ height: 8 }}></div>
      <TextInput
        className={classes.searchField}
        placeholder={"Search"}
        value={searchFilter}
        setValue={async (e) => {
          const prefix = e.target.value;
          setSearchFilter(prefix);
          if (prefix.length >= 3) {
            //TODO debounce
            const res = await ParentCommunicationManager.getInstance().fetch(
              `${BACKEND_API_URL}/users?usernamePrefix=${prefix}`
            );
            const json = await res.json();
            setSearchResults(json.users || []);
          } else {
            setSearchResults([]);
          }
        }}
        inputProps={{
          style: {
            height: "48px",
          },
        }}
      />
      {messagesLoading && <MessagesSkeleton />}
      {!messagesLoading &&
        (activeChats.filter((x) => x.remoteUsername.includes(searchFilter))
          .length > 0 ||
          requestCount > 0) && (
          <MessageList
            requestCount={searchFilter.length < 3 ? requestCount : 0}
            activeChats={activeChats.filter((x) =>
              x.remoteUsername.includes(searchFilter)
            )}
          />
        )}
      {searchFilter.length >= 3 && searchedUsersDistinct.length !== 0 && (
        <div style={{ marginTop: 10 }}>
          <UserList users={searchedUsersDistinct} />
        </div>
      )}
    </div>
  );
}