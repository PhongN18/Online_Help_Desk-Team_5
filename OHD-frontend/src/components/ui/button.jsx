export function Button({ children, type = "button", variant = "default", className, ...props }) {
    const baseStyles = "px-4 py-2 rounded-lg font-medium focus:outline-none transition";
    const variants = {
        default: "bg-blue-500 text-white hover:bg-blue-600",
        ghost: "bg-transparent text-gray-700 hover:bg-gray-200",
    };

    return (
        <button type={type} className={`${baseStyles} ${variants[variant]} ${className}`} {...props}>
            {children}
        </button>
    );
}
