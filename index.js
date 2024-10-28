const express = require('express');
const fetch = require('node-fetch');

const app = express();
const PORT = 3000;

async function fetchPublicSuffixList() {
    const publicSuffixURL =
      "https://publicsuffix.org/list/public_suffix_list.dat";

    try {
      const response = await fetch(publicSuffixURL);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const text = await response.text();
      const tlds = [];

      // Parse each line, ignoring comments and empty lines
      text.split("\n").forEach((line) => {
        line = line.trim();
        if (line && !line.startsWith("//")) {
          tlds.push(line); // Add each valid TLD or public suffix to the array
        }
      });

      return tlds; // Array of TLDs and suffixes
    } catch (error) {
      console.error("Error fetching Public Suffix List:", error);
      return []; // Return empty array if fetching fails
    }
  }

  // Function to check if a hostname contains a multi-part TLD
  function getRootDomain(hostname, tlds) {
    const hostnameParts = hostname.split(".");

    for (let i = 0; i < hostnameParts.length; i++) {
      const potentialTLD = hostnameParts.slice(i).join(".");
      if (tlds.includes(potentialTLD)) {
        const rootDomain = hostnameParts.slice(0, i).join(".");
        return rootDomain || potentialTLD; // Return root domain or TLD if no root domain exists
      }
    }

    return hostname; // Fallback to entire hostname if no TLD is matched
  }

  async function fetchDomainInfo(hostname) {
    try {
    const tlds= await fetchPublicSuffixList();
    const domain= getRootDomain(hostname,tlds);
      console.log("--domain---", domain);
      const response = await fetch(`https://who-dat.as93.net/${domain}`, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      console.log("--response---", response);
      const data = await response.json();
      displayDomainInfo(data);
    } catch (error) {
      console.log("--error---", error);
      showError(`Failed to fetch domain information: ${error}`);
      console.error("Error:", error);
    }
  }

// Endpoint to fetch data from an external API and return it to the client
app.get('/api/data/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const response = await fetchDomainInfo(id);
        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching data' });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
