export function cleanOutput(string) {
    string = string.replace(/[\n\r]/g, '');
    string = string.trim();

    return string;
}

export function versionCompare(currentVersion, latestVersion) {
    console.log(currentVersion, latestVersion);
    const currentParts = currentVersion.split(/[\.\-\+]/).map(part => part.trim());
    const latestParts  = latestVersion.split(/[\.\-\+]/).map(part => part.trim());

    // Compare major.minor.patch first (numeric)
    for (let i = 0; i < Math.max(currentParts.length, latestParts.length); i++) {
      const c = parseInt(currentParts[i] || '0', 10);
      const l = parseInt(latestParts[i] || '0', 10);
      console.log(c, l);

      // If we can't parse → treat as string comparison from this point
      if (isNaN(c) || isNaN(l)) {
        const cmp = latestVersion.localeCompare(currentVersion, undefined, { numeric: true, sensitivity: 'base' });
        return cmp > 0;
      }

      if (l > c) return true;
      if (l < c) return false;
    }

    // versions are equal
    return false;
}