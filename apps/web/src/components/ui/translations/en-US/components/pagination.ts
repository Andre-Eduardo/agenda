import type {Dictionary} from '../..';
import type {PaginationTranslations} from '../../../components/Pagination/translations';

export const pagination: Dictionary<PaginationTranslations> = {
    pagination: 'Pagination',
    page: 'Page {{page}}',
    next: 'Next',
    prev: 'Previous',
    summary: 'Page {{currentPage}} of {{totalPages}}',
    goToNext: 'Go to next page',
    goToPrev: 'Go to previous page',
    itemCount: '{{from}}-{{to}} of {{total}} records',
};
