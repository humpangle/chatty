declare module 'react-native-alphabetlistview' {
  import * as React from 'react'
  import { StyleProp, ViewStyle, ViewProperties } from "react-native";

  export type AlphabetListViewProps<Item> = ViewProperties & {
    /**
     * The data to render in the listview
     */
    data: Item[] | {[key: string]: Item};

    /**
     * Whether to show the section listing or not
     */
    hideSectionList?: boolean

    /**
     * Functions to provide a title for the section header and the section list
     * items. If not provided, the section ids will be used (the keys from the data object)
     */
    getSectionTitle?: () => void;
    getSectionListTitle?: () => void;

    /**
     * Function to sort sections. If not provided, the sections order will match data source
     */
    compareFunction?: () => void;

    /**
     * Callback which should be called when a cell has been selected
     */
    onCellSelect?: () => void;

    /**
     * Callback which should be called when the user scrolls to a section
     */
    onScrollToSection?: () => void;

    /**
     * The cell element to render for each row
     */
    cell: React.ComponentType<any>

    /**
     * A custom element to render for each section list item
     */
    sectionListItem?: React.ComponentType<any>;

    /**
     * A custom element to render for each section header
     */
    sectionHeader?: React.ComponentType<any>;

    /**
     * A custom element to render as footer
     */
    footer?: React.ComponentType<any>;

     /**
     * A custom element to render as header
     */

    /**
     * A custom element to render as header
     */
    header?: React.ComponentType<any>;

    /**
     * The height of the header element to render. Is required if a
     * header element is used, so the positions can be calculated correctly
     */
    headerHeight?: number;

    /**
     * A custom function to render as header
     */
    renderHeader?: () => React.ComponentType<any>;

    /**
     * A custom function to render as footer
     */
    renderFooter?: () => React.ComponentType<any>;

    /**
     * An object containing additional props, which will be passed
     * to each cell component
     */
    cellProps?: {[key: string]: any};

    /**
     * The height of the section header component
     */
    sectionHeaderHeight: number;

    /**
     * The height of the cell component
     */
    cellHeight: number;

    /**
     * Whether to determine the y postion to scroll to by calculating header and
     * cell heights or by using the UIManager to measure the position of the
     * destination element. This is an exterimental feature
     */
    useDynamicHeights?: boolean;

    /**
     * Whether to set the current y offset as state and pass it to each
     * cell during re-rendering
     */
    updateScrollState?: boolean

    /**
     * Styles to pass to the section list container
     */
    sectionListStyle?: StyleProp<ViewStyle>



  }

  export default class AlphabetListView extends React.Component<AlphabetListViewProps<any>, any>{}
}
