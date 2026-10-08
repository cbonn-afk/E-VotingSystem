"use client";

// Next Imports
import Link from "next/link";

// Third-party Imports
import classnames from "classnames";

// Hook Imports
import useVerticalNav from "@menu/hooks/useVerticalNav";

// Util Imports
import { verticalLayoutClasses } from "@layouts/utils/layoutClasses";

const FooterContent = () => {
  // Hooks
  const { isBreakpointReached } = useVerticalNav();

  return (
    <div
      className={classnames(
        verticalLayoutClasses.footerContent,
        "flex items-center justify-between flex-wrap gap-4",
      )}
    >
      <div className="flex items-center justify-between flex-wrap gap-4 max-w-[500px] mx-auto">
        <p className="text-center">
          <span className="text-textSecondary">{`© ${new Date().getFullYear()} `}</span>
          <Link
            href="https://www.facebook.com/AIURTechnologiesPH"
            target="_blank"
            className="text-primary"
          >
            Aiur Technologies Corp
          </Link>
          <span className="text-textSecondary">, All rights reserved</span>
        </p>
      </div>
    </div>
  );
};

export default FooterContent;
