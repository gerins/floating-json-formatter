let lastPosition = { bottom: "20px", right: "20px" }; // default position
let lastSize = { width: "500px", height: "400px" }; // default size
let lastRawJson = ""; // store unformatted JSON for copying

function syntaxHighlight(json) {
  if (typeof json != "string") {
    json = JSON.stringify(json, undefined, 2);
  }
  json = json
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return json.replace(
    /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
    function (match) {
      let cls = "number";
      if (/^"/.test(match)) {
        if (/:$/.test(match)) {
          cls = "key";
        } else {
          cls = "string";
        }
      } else if (/true|false/.test(match)) {
        cls = "boolean";
      } else if (/null/.test(match)) {
        cls = "null";
      }
      return '<span class="' + cls + '">' + match + "</span>";
    }
  );
}

function showFloatingBox(jsonText) {
  let box = document.getElementById("json-floating-box");

  // Always keep raw JSON string for copy button
  lastRawJson =
    typeof jsonText === "string" ? jsonText : JSON.stringify(jsonText, null, 2);

  // If box exists → reuse it, just update content
  if (box) {
    box.querySelector(".json-content").innerHTML = syntaxHighlight(lastRawJson);
    return;
  }

  box = document.createElement("div");
  box.id = "json-floating-box";

  // Restore last position & size
  box.style.width = lastSize.width;
  box.style.height = lastSize.height;

  if (lastPosition.top || lastPosition.left) {
    box.style.top = lastPosition.top;
    box.style.left = lastPosition.left;
  } else {
    box.style.bottom = lastPosition.bottom;
    box.style.right = lastPosition.right;
  }

  const header = document.createElement("div");
  header.className = "json-header";

  const title = document.createElement("span");
  title.innerText = "JSON Preview";

  const controls = document.createElement("div");
  controls.className = "json-controls";

  // Copy Button
  const copyBtn = document.createElement("button");
  copyBtn.className = "json-copy";
  copyBtn.innerText = "Copy";
  copyBtn.onclick = () => {
    const text = box.querySelector(".json-content").innerText;
    navigator.clipboard.writeText(text).then(() => {
      copyBtn.innerText = "Copied!";
      setTimeout(() => (copyBtn.innerText = "Copy"), 1500);
    });
  };

  // Close Button
  const closeBtn = document.createElement("button");
  closeBtn.className = "json-close";
  closeBtn.innerText = "×";
  closeBtn.onclick = () => {
    box.remove();
  };

  controls.appendChild(copyBtn);
  controls.appendChild(closeBtn);

  header.appendChild(title);
  header.appendChild(controls);

  const content = document.createElement("pre");
  content.className = "json-content";
  content.innerHTML = syntaxHighlight(lastRawJson);

  // Resize Handle
  const resizeHandle = document.createElement("div");
  resizeHandle.className = "json-resize";

  box.appendChild(header);
  box.appendChild(content);
  box.appendChild(resizeHandle);
  document.body.appendChild(box);

  makeDraggable(box, header);
  makeResizable(box, resizeHandle);
}

function makeDraggable(el, handle) {
  let offsetX = 0,
    offsetY = 0,
    isDown = false;

  handle.addEventListener("mousedown", (e) => {
    isDown = true;
    offsetX = e.clientX - el.offsetLeft;
    offsetY = e.clientY - el.offsetTop;
    document.body.style.userSelect = "none";
  });

  document.addEventListener("mouseup", () => {
    if (isDown) {
      lastPosition = {
        top: el.style.top,
        left: el.style.left,
        bottom: el.style.bottom,
        right: el.style.right,
      };
    }
    isDown = false;
    document.body.style.userSelect = "auto";
  });

  document.addEventListener("mousemove", (e) => {
    if (!isDown) return;
    el.style.left = `${e.clientX - offsetX}px`;
    el.style.top = `${e.clientY - offsetY}px`;
    el.style.right = "auto";
    el.style.bottom = "auto";
  });
}

function makeResizable(el, handle) {
  let isResizing = false,
    startX,
    startY,
    startWidth,
    startHeight;

  handle.addEventListener("mousedown", (e) => {
    isResizing = true;
    startX = e.clientX;
    startY = e.clientY;
    startWidth = el.offsetWidth;
    startHeight = el.offsetHeight;
    document.body.style.userSelect = "none";
    e.preventDefault();
  });

  document.addEventListener("mousemove", (e) => {
    if (!isResizing) return;
    const newWidth = startWidth + (e.clientX - startX);
    const newHeight = startHeight + (e.clientY - startY);
    el.style.width = newWidth + "px";
    el.style.height = newHeight + "px";
  });

  document.addEventListener("mouseup", () => {
    if (isResizing) {
      lastSize = {
        width: el.style.width,
        height: el.style.height,
      };
    }
    isResizing = false;
    document.body.style.userSelect = "auto";
  });
}

// Detect text selection
document.addEventListener("mouseup", (e) => {
  setTimeout(() => {
    const selection = window.getSelection().toString().trim();
    if (!selection) return;

    if (e.target.closest("#json-floating-box")) {
      return;
    }

    try {
      const parsed = JSON.parse(selection);
      showFloatingBox(parsed);
    } catch {
      console.log("Selection is not valid JSON");
    }
  }, 50);
});
