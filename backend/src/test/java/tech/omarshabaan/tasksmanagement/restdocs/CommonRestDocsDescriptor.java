package tech.omarshabaan.tasksmanagement.restdocs;

import org.springframework.http.HttpHeaders;
import org.springframework.restdocs.headers.HeaderDescriptor;
import org.springframework.restdocs.payload.FieldDescriptor;
import org.springframework.restdocs.request.ParameterDescriptor;

import static org.springframework.restdocs.headers.HeaderDocumentation.headerWithName;
import static org.springframework.restdocs.payload.PayloadDocumentation.fieldWithPath;
import static org.springframework.restdocs.request.RequestDocumentation.parameterWithName;
import static org.springframework.restdocs.snippet.Attributes.key;

/**
 * Common REST Docs descriptors for reuse across controller tests. Contains field
 * descriptors, header descriptors, and parameter descriptors.
 */
public class CommonRestDocsDescriptor {

	// Pagination fields for paginated responses (VIA_DTO mode - nested structure)
	public static final FieldDescriptor[] PAGINATION_FIELDS = new FieldDescriptor[] {
			fieldWithPath("page").description("Pagination information"),
			fieldWithPath("page.size").description("The number of elements per page"),
			fieldWithPath("page.number").description("The current page number (0-indexed)"),
			fieldWithPath("page.totalElements").description("Total number of elements across all pages"),
			fieldWithPath("page.totalPages").description("Total number of pages") };

	// Common headers
	public static final HeaderDescriptor AUTHORIZATION_HEADER = headerWithName(HttpHeaders.AUTHORIZATION)
		.description("Bearer token for authentication");

	public static final HeaderDescriptor CONTENT_TYPE_HEADER = headerWithName(HttpHeaders.CONTENT_TYPE)
		.description("Content type of the request body");

	// Pagination parameters
	public static final ParameterDescriptor[] PAGINATION_PARAMS = new ParameterDescriptor[] {
			parameterWithName("page").description("The page number to retrieve")
				.attributes(key("optional").value(true), key("defaultValue").value(0),
						key("constraint").value("Must be greater than or equal to 0"))
				.optional(),
			parameterWithName("size").description("The number of records per page")
				.attributes(key("optional").value(true), key("defaultValue").value(20),
						key("constraint").value("Must be greater than 0"))
				.optional() };

	// Common error response fields
	public static final FieldDescriptor[] ERROR_RESPONSE_FIELDS = new FieldDescriptor[] {
			fieldWithPath("type").description("Error type URI").optional(),
			fieldWithPath("title").description("Error title").optional(),
			fieldWithPath("status").description("HTTP status code").optional(),
			fieldWithPath("detail").description("Detailed error message").optional(),
			fieldWithPath("instance").description("Request path that caused the error").optional(),
			fieldWithPath("timestamp").description("Error timestamp").optional() };

	private CommonRestDocsDescriptor() {
		// Utility class
	}

}
