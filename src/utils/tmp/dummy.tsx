import React from 'react';

type TIconProps = {
    icon?: string;
    className?: string;
    size?: number | string;
    width?: number | string;
    height?: number | string;
    color?: string;
    custom_color?: string;
    onClick?: React.MouseEventHandler<SVGSVGElement>;
};

/**
 * Lightweight placeholder for the legacy Deriv sprite `Icon` component.
 * The original lived in a gitignored `tmp/` folder, so it was missing from
 * production builds. This stub keeps the shared_ui components rendering
 * without pulling in the full icon sprite.
 */
export const Icon = ({ icon, className, size = 16, width, height, custom_color, onClick }: TIconProps) => (
    <svg
        className={className}
        width={width ?? size}
        height={height ?? size}
        viewBox='0 0 16 16'
        fill='none'
        aria-hidden='true'
        data-icon={icon}
        style={custom_color ? { color: custom_color } : undefined}
        onClick={onClick}
    />
);

export default Icon;
