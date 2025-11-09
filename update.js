async function updateTargetTime() {
  const token = document.getElementById('admin-token').value;
  const newTime = new Date(document.getElementById('new-time').value);
  const status = document.getElementById('update-status');

  if (!token || isNaN(newTime)) {
    status.textContent = "Please enter both a valid token and time.";
    return;
  }

  const fileUrl = 'https://api.github.com/repos/cosr2024/cosr2024.github.io/contents/config.json';

  // Fetch existing file info (required to get the 'sha')
  const currentFile = await fetch(fileUrl);
  const currentData = await currentFile.json();

  const updatedContent = btoa(JSON.stringify({ target_time: newTime.toISOString() }, null, 2));

  const body = {
    message: "Update target time",
    content: updatedContent,
    sha: currentData.sha
  };

  const res = await fetch(fileUrl, {
    method: 'PUT',
    headers: {
      'Authorization': `token ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (res.ok) {
    status.textContent = "✅ Target time updated successfully.";
  } else {
    const error = await res.json();
    status.textContent = "❌ Update failed: " + (error.message || "unknown error");
  }
}

document.getElementById('update-btn').addEventListener('click', updateTargetTime);
