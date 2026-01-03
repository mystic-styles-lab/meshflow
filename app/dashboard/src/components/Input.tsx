import {
  chakra,
  Input as ChakraInput,
  InputProps as ChakraInputProps,
  FormControl,
  FormErrorMessage,
  FormLabel,
  InputGroup,
  InputLeftAddon,
  InputRightAddon,
  InputRightElement,
  NumberDecrementStepper,
  NumberIncrementStepper,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
} from "@chakra-ui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import classNames from "classnames";
import React, { PropsWithChildren, ReactNode } from "react";

const ClearIcon = chakra(XMarkIcon, {
  baseStyle: {
    w: 4,
    h: 4,
  },
});

export type InputProps = PropsWithChildren<
  {
    value?: string;
    className?: string;
    endAdornment?: ReactNode;
    startAdornment?: ReactNode;
    type?: string;
    placeholder?: string;
    onChange?: (e: any) => void;
    onBlur?: (e: any) => void;
    onClick?: (e: any) => void;
    name?: string;
    error?: string;
    disabled?: boolean;
    step?: number;
    label?: string;
    clearable?: boolean;
  } & ChakraInputProps
>;

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      disabled,
      step,
      label,
      className,
      startAdornment,
      endAdornment,
      type = "text",
      placeholder,
      onChange,
      onBlur,
      name,
      value,
      onClick,
      error,
      clearable = false,
      ...props
    },
    ref
  ) => {
    const clear = () => {
      if (onChange)
        onChange({
          target: {
            value: "",
            name,
          },
        });
    };
    const { size = "md" } = props;
    const Component = type == "number" ? NumberInputField : ChakraInput;
    const Wrapper = type == "number" ? NumberInput : React.Fragment;
    const wrapperProps =
      type == "number"
        ? {
            keepWithinRange: true,
            precision: 5,
            format: (value: string | number) => {
              return isNaN(parseFloat(String(value)))
                ? value
                : Number(parseFloat(String(value)).toFixed(5)) === 0
                ? value
                : Number(parseFloat(String(value)).toFixed(5));
            },
            min: 0,
            step,
            name,
            type,
            placeholder,
            onChange: (v: any) => {
              if (onChange) onChange(v);
            },
            onBlur,
            value,
            onClick,
            disabled,
            flexGrow: 1,
            size,
          }
        : {};
    return (
      <FormControl isInvalid={!!error}>
        {label && <FormLabel fontSize="sm" mb={1}>{label}</FormLabel>}
        <InputGroup
          size={size}
          w="full"
          _focusWithin={{
            borderColor: "blue.400",
            boxShadow: "0 0 0 1px blue.400"
          }}
          bg={disabled ? "gray.600" : "rgba(255, 255, 255, 0.05)"}
          border="1px solid rgba(255, 255, 255, 0.1)"
          borderRadius="20px"
          boxShadow="inset 0 1px 0 rgba(255, 255, 255, 0.05)"
          _light={{ 
            bg: disabled ? "gray.200" : "rgba(255, 255, 255, 0.7)",
            border: "1px solid rgba(0, 0, 0, 0.1)",
            boxShadow: "inset 0 1px 0 rgba(255, 255, 255, 0.5)",
          }}
        >
          {startAdornment && <InputLeftAddon>{startAdornment}</InputLeftAddon>}
          <Wrapper {...wrapperProps}>
            {/* @ts-ignore */}
            <Component
              name={name}
              ref={ref}
              step={step}
              className={classNames(className)}
              type={type}
              placeholder={placeholder}
              onChange={onChange}
              onBlur={onBlur}
              value={value}
              onClick={onClick}
              disabled={disabled}
              flexGrow={1}
              bg="transparent"
              border="none"
              color="white"
              _light={{ color: "gray.800" }}
              _placeholder={{ color: "gray.400", _light: { color: "gray.500" } }}
              _focusVisible={{
                outline: "none",
                borderTopColor: "transparent",
                borderRightColor: "transparent",
                borderBottomColor: "transparent",
              }}
              _disabled={{
                cursor: "not-allowed",
                opacity: 0.6,
              }}
              {...props}
              roundedLeft={startAdornment ? "0" : "md"}
              roundedRight={endAdornment ? "0" : "md"}
            />
            {type == "number" && (
              <>
                <NumberInputStepper>
                  <NumberIncrementStepper />
                  <NumberDecrementStepper />
                </NumberInputStepper>
              </>
            )}
          </Wrapper>
          {endAdornment && (
            <InputRightAddon
              borderLeftRadius={0}
              borderRightRadius="20px"
              bg="transparent"
              border="none"
              color="gray.400"
              _light={{ color: "gray.500" }}
            >
              {endAdornment}
            </InputRightAddon>
          )}
          {clearable && value && value.length && (
            <InputRightElement
              borderLeftRadius={0}
              borderRightRadius="6px"
              bg="transparent"
              onClick={clear}
              cursor="pointer"
            >
              <ClearIcon />
            </InputRightElement>
          )}
        </InputGroup>
        {!!error && <FormErrorMessage>{error}</FormErrorMessage>}
      </FormControl>
    );
  }
);
