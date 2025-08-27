'use client'

import LiquidPage from '@/components/shared/liquid-page'

export default function TermsOfServicePage() {
  return (
    <LiquidPage backgroundVariant="warm">
      <section className="liquid-glass-card backdrop-blur-2xl bg-white/[0.06] border border-white/[0.1] rounded-3xl p-8 md:p-12 max-w-4xl w-full shadow-2xl shadow-black/20">
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-extralight text-white mb-4 drop-shadow-lg">Terms of Service</h1>
          <p className="text-white max-w-2xl mx-auto font-light">Last Updated: August 19, 2025</p>
          <div className="w-20 h-px bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent mx-auto mt-6"></div>
        </div>

        <div className="space-y-8 text-white">
          <div>
            <h2 className="text-2xl font-light mb-3">1. Agreement to Terms</h2>
            <p className="mb-4">
              By accessing our website at camilomartinez.co, you are agreeing to be bound by these Terms of Service, 
              all applicable laws and regulations, and agree that you are responsible for compliance with any applicable 
              local laws. If you do not agree with any of these terms, you are prohibited from using or accessing this site. 
              The materials contained in this website are protected by applicable copyright and trademark law.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-light mb-3">2. Use License</h2>
            <p className="mb-3">
              Permission is granted to temporarily download one copy of the materials (information or software) on Camilo Martinez's 
              website for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, 
              and under this license you may not:
            </p>

            <ul className="list-disc pl-6 mb-3 space-y-2">
              <li>Modify or copy the materials</li>
              <li>Use the materials for any commercial purpose, or for any public display (commercial or non-commercial)</li>
              <li>Attempt to decompile or reverse engineer any software contained on Camilo Martinez's website</li>
              <li>Remove any copyright or other proprietary notations from the materials</li>
              <li>Transfer the materials to another person or "mirror" the materials on any other server</li>
            </ul>

            <p className="mb-3">
              This license shall automatically terminate if you violate any of these restrictions and may be terminated by 
              Camilo Martinez at any time. Upon terminating your viewing of these materials or upon the termination of this license, 
              you must destroy any downloaded materials in your possession whether in electronic or printed format.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-light mb-3">3. Disclaimer</h2>
            <p className="mb-3">
              The materials on Camilo Martinez's website are provided on an 'as is' basis. Camilo Martinez makes no warranties, 
              expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied 
              warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual 
              property or other violation of rights.
            </p>
            <p className="mb-3">
              Further, Camilo Martinez does not warrant or make any representations concerning the accuracy, likely results, 
              or reliability of the use of the materials on its website or otherwise relating to such materials or on any sites 
              linked to this site.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-light mb-3">4. Limitations</h2>
            <p className="mb-3">
              In no event shall Camilo Martinez or its suppliers be liable for any damages (including, without limitation, 
              damages for loss of data or profit, or due to business interruption) arising out of the use or inability to 
              use the materials on Camilo Martinez's website, even if Camilo Martinez or a Camilo Martinez authorized 
              representative has been notified orally or in writing of the possibility of such damage. Because some jurisdictions 
              do not allow limitations on implied warranties, or limitations of liability for consequential or incidental 
              damages, these limitations may not apply to you.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-light mb-3">5. Accuracy of Materials</h2>
            <p className="mb-3">
              The materials appearing on Camilo Martinez's website could include technical, typographical, or photographic 
              errors. Camilo Martinez does not warrant that any of the materials on its website are accurate, complete or 
              current. Camilo Martinez may make changes to the materials contained on its website at any time without notice. 
              However, Camilo Martinez does not make any commitment to update the materials.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-light mb-3">6. Links</h2>
            <p className="mb-3">
              Camilo Martinez has not reviewed all of the sites linked to its website and is not responsible for the contents 
              of any such linked site. The inclusion of any link does not imply endorsement by Camilo Martinez of the site. 
              Use of any such linked website is at the user's own risk.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-light mb-3">7. Modifications</h2>
            <p className="mb-3">
              Camilo Martinez may revise these terms of service for its website at any time without notice. By using this website, 
              you are agreeing to be bound by the then current version of these terms of service.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-light mb-3">8. Governing Law</h2>
            <p className="mb-3">
              These terms and conditions are governed by and construed in accordance with the laws of the United States, 
              and you irrevocably submit to the exclusive jurisdiction of the courts in that location.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-light mb-3">9. User Data Rights</h2>
            <p className="mb-3">
              Users have the right to:
            </p>
            <ul className="list-disc pl-6 mb-3 space-y-2">
              <li>Access their personal data</li>
              <li>Correct their personal data</li>
              <li>Delete their personal data</li>
              <li>Export their personal data</li>
              <li>Object to processing of their personal data</li>
              <li>Request restriction of processing their personal data</li>
            </ul>
            <p className="mb-3">
              To exercise any of these rights, please contact us using the information provided below.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-light mb-3">10. Contact Us</h2>
            <p className="mb-3">
              If you have any questions about these Terms of Service, please contact us at:
            </p>
            <p>
              Camilo Martinez<br />
              Email: contact@camilomartinez.co<br />
              Website: camilomartinez.co
            </p>
          </div>
        </div>
      </section>
    </LiquidPage>
  )
}
