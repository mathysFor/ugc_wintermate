import dotenv from 'dotenv';

dotenv.config();

const APPSFLYER_DEV_KEY = process.env.APPSFLYER_DEV_KEY;
const APPSFLYER_APP_ID = process.env.APPSFLYER_APP_ID;
const APPSFLYER_TEMPLATE_ID = process.env.APPSFLYER_TEMPLATE_ID;

interface OneLinkResponse {
  short_link: string;
}

class AppsFlyerService {
  /**
   * Generates an AppsFlyer OneLink for a creator
   * @param referralCode The creator's referral code to track
   * @returns The generated short link or null if generation fails
   */
  async generateOneLink(referralCode: string): Promise<string | null> {
    if (!APPSFLYER_DEV_KEY || !APPSFLYER_TEMPLATE_ID) {
      console.warn('[AppsFlyer] Missing credentials, skipping OneLink generation');
      return null;
    }

    try {
      // Documentation: https://dev.appsflyer.com/hc/docs/onelink-api-shortlink
      const url = `https://onelink.appsflyer.com/shortlink/v1/${APPSFLYER_TEMPLATE_ID}`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'authorization': APPSFLYER_DEV_KEY,
        },
        body: JSON.stringify({
          data: {
            pid: 'af_app_invites', // Media source
            af_siteid: 'ugc_wintermate', // Optional: Site ID
            af_sub1: referralCode, // Storing referral code in sub1 param
            // You can add more parameters here if needed
          }
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[AppsFlyer] API Error (${response.status}):`, errorText);
        return null;
      }

      const data = await response.json() as OneLinkResponse;
      return data.short_link;
    } catch (error) {
      console.error('[AppsFlyer] Error generating OneLink:', error);
      return null;
    }
  }
}

export const appsflyerService = new AppsFlyerService();
