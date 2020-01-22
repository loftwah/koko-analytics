<?php

namespace KokoAnalytics\Migrations\OneZeroSix;

global $wpdb;

// copied from aggregator class because we can't rely on it being there forever
function normalize_url( $url ) {
	$aggregations = array(
		'/(google|bing)\.([a-z]{2,3}(?:\.[a-z]{2,3})?)\/(?:search|url)/' => '$1.$2',
		'/(?:i|m)\.facebook\.com/' => 'facebook.com',
		'/pinterest\.com\/pin\/.*/' => 'pinterest.com',
		'/linkedin\.com\/feed.*/' => 'linkedin.com',
		'/(?:www|m)\.baidu\.com.*/' => 'www.baidu.com',
		'/yandex\.ru\/clck.*/' => 'yandex.ru',
	);

	return preg_replace( array_keys( $aggregations ), array_values( $aggregations ), $url, 1 );
}

$referrer_urls = $wpdb->get_results( "SELECT * FROM {$wpdb->prefix}koko_analytics_referrer_urls" );

// create map so we can quickly get ID for other URL's
$map = array();
foreach ( $referrer_urls as $row ) {
	$map[$row->url] = $row->id;
}

foreach ( $referrer_urls as $row ) {
	$normalized_url = normalize_url( $row->url );
	if ($normalized_url === $row->url ) {
		continue;
	}

	// URL is different! We need to update stats.
	if ( isset( $map[ $normalized_url ] ) ) {
		$wpdb->query( $wpdb->prepare( "UPDATE {$wpdb->prefix}koko_analytics_referrer_stats SET id = %d WHERE id = %d", $map[ $normalized_url ], $row->id ) );
		$wpdb->query( $wpdb->prepare( "DELETE FROM {$wpdb->prefix}koko_analytics_referrer_urls WHERE id = %d", $row->id ) );
	} else {
		$wpdb->query( $wpdb->prepare( "UPDATE {$wpdb->prefix}koko_analytics_referrer_urls SET url = %s WHERE id = %d", $normalized_url, $row->id ) );
	}
}
