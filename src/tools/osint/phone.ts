export class PhoneTool {
  async lookup(phone: string): Promise<string> {
    const cleaned = phone.replace(/[\s\-\(\)\.]/g, '');
    const results: string[] = [`Phone: ${cleaned}`];

    if (cleaned.startsWith('+62') || cleaned.startsWith('62')) {
      results.push(`Country: Indonesia`);
      results.push(`Carrier lookup: https://www.google.com/search?q=${encodeURIComponent(cleaned + ' carrier')}`);
      results.push(`Truecaller: https://www.truecaller.com/search?countryCode=id&phoneNumber=${cleaned}`);
    } else if (cleaned.startsWith('+1') || cleaned.startsWith('1')) {
      results.push(`Country: USA/Canada`);
      results.push(`Carrier lookup: https://www.google.com/search?q=${encodeURIComponent(cleaned + ' carrier')}`);
    } else {
      results.push(`Country: Unknown (use full international format with +)`);
    }

    results.push(`Whitepages: https://www.whitepages.com/phone/${cleaned}`);
    results.push(`Google search: https://www.google.com/search?q=${encodeURIComponent(cleaned)}`);

    return results.join('\n');
  }
}

export const phoneTool = new PhoneTool();
